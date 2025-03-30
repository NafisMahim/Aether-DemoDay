import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API keys from environment variables (also hardcoded as fallback as requested by user)
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN || 'DSBQW62GEUQM7ONFQ5K5';
const TICKETMASTER_KEY = process.env.TICKETMASTER_KEY || 'buoqK3RrRD1tk73Uquh3JRtSLFeOG9Zp';

// Interfaces for event data
interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description?: {
    text: string;
    html: string;
  };
  url: string;
  start: {
    timezone: string;
    utc: string;
    local: string;
  };
  end: {
    timezone: string;
    utc: string;
    local: string;
  };
  organization_id: string;
  created: string;
  changed: string;
  published?: string;
  capacity?: number;
  capacity_is_custom: boolean;
  status: string;
  currency: string;
  listed?: boolean;
  shareable?: boolean;
  invite_only?: boolean;
  online_event?: boolean;
  show_remaining?: boolean;
  logo_id?: string;
  venue_id?: string;
  category_id?: string;
  subcategory_id?: string;
  format_id?: string;
  venue?: {
    address?: {
      city?: string;
      region?: string;
      postal_code?: string;
      country?: string;
      address_1?: string;
      address_2?: string;
    };
    name?: string;
  };
}

interface TicketmasterEvent {
  name: string;
  id: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
    };
    status: {
      code: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: {
        name: string;
      };
      state?: {
        name: string;
      };
      country?: {
        name: string;
      };
      address?: {
        line1: string;
      };
    }>;
  };
  classifications?: Array<{
    segment?: {
      name: string;
    };
    genre?: {
      name: string;
    };
    subGenre?: {
      name: string;
    };
  }>;
  info?: string;
  description?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

// Standardized event format for the front-end
export interface NetworkingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  venue?: string;
  url: string;
  type: "conference" | "workshop" | "meetup" | "concert" | "sporting" | "networking" | "other";
  categories: string[];
  source: "eventbrite" | "ticketmaster";
  image?: string;
  relevanceScore?: number;
}

/**
 * Search for events from Eventbrite based on user preferences
 * @param interestKeywords Array of keywords to search for
 * @param location Optional location parameter (city, address, etc.)
 * @returns Promise resolving to array of standardized networking events
 */
export async function searchEventbriteEvents(
  interestKeywords: string[],
  location?: string
): Promise<NetworkingEvent[]> {
  try {
    // Join keywords for the search query
    const query = interestKeywords.join(' OR ');
    
    // Base URL for Eventbrite API
    let url = `https://www.eventbriteapi.com/v3/events/search/?q=${encodeURIComponent(query)}&expand=venue`;
    
    // Add location parameter if provided
    if (location) {
      url += `&location.address=${encodeURIComponent(location)}`;
    }
    
    console.log(`[Eventbrite] Attempting to fetch events with URL: ${url}`);
    
    // Make API request to Eventbrite
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`
      },
      validateStatus: (status) => status < 500, // Accept any status code less than 500 to handle 404s gracefully
    });
    
    // Check if the response contains an error
    if (response.data && response.data.error) {
      console.error(`[Eventbrite] API Error: ${response.data.error} - ${response.data.error_description}`);
      return [];
    }
    
    // Map Eventbrite events to standardized format
    if (response.data && response.data.events && Array.isArray(response.data.events)) {
      console.log(`[Eventbrite] Successfully fetched ${response.data.events.length} events`);
      return response.data.events.map((event: EventbriteEvent) => {
        // Determine event type based on Eventbrite category (simplified)
        let type: NetworkingEvent['type'] = "other";
        
        // Set default categories
        const categories: string[] = [];
        
        // Extract time information
        const dateObj = event.start ? new Date(event.start.local) : new Date();
        const date = dateObj.toISOString().split('T')[0];
        const time = event.start ? event.start.local.split('T')[1].substring(0, 5) : undefined;
        
        // Map to standardized event format
        return {
          id: event.id,
          title: event.name.text,
          description: event.description ? event.description.text.substring(0, 200) + '...' : 'No description available',
          date,
          time,
          venue: event.venue?.name,
          location: event.venue?.address ? 
            [
              event.venue.address.address_1,
              event.venue.address.address_2
            ].filter(Boolean).join(', ') : undefined,
          city: event.venue?.address?.city,
          state: event.venue?.address?.region,
          country: event.venue?.address?.country,
          url: event.url,
          type,
          categories,
          source: "eventbrite"
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    return [];
  }
}

/**
 * Search for events from Ticketmaster based on user preferences
 * @param interestKeywords Array of keywords to search for
 * @param location Optional location parameter (city, address, etc.)
 * @returns Promise resolving to array of standardized networking events
 */
export async function searchTicketmasterEvents(
  interestKeywords: string[],
  location?: string
): Promise<NetworkingEvent[]> {
  try {
    // Join keywords for search query
    const keyword = interestKeywords.join(' OR ');
    
    // Base URL for Ticketmaster API
    let url = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${encodeURIComponent(keyword)}&apikey=${TICKETMASTER_KEY}`;
    
    // Add location parameter if provided
    if (location) {
      url += `&city=${encodeURIComponent(location)}`;
    }
    
    console.log(`[Ticketmaster] Attempting to fetch events with URL: ${url.replace(TICKETMASTER_KEY, '***')}`);
    
    // Make API request to Ticketmaster
    const response = await axios.get(url, {
      validateStatus: (status) => status < 500, // Accept any status code less than 500 to handle errors gracefully
    });
    
    // Check for errors in the response
    if (response.status !== 200) {
      console.error(`[Ticketmaster] API Error: Status ${response.status}`);
      return [];
    }
    
    // Map Ticketmaster events to standardized format
    if (response.data && response.data._embedded && response.data._embedded.events) {
      console.log(`[Ticketmaster] Successfully fetched ${response.data._embedded.events.length} events`);
      return response.data._embedded.events.map((event: TicketmasterEvent) => {
        // Extract venue information
        const venue = event._embedded?.venues?.[0];
        
        // Determine event type based on Ticketmaster classification
        let type: NetworkingEvent['type'] = "other";
        const segment = event.classifications?.[0]?.segment?.name?.toLowerCase() || '';
        
        if (segment.includes('conference') || segment.includes('business')) {
          type = "conference";
        } else if (segment.includes('workshop') || segment.includes('learning')) {
          type = "workshop";
        } else if (segment.includes('music') || segment.includes('concert')) {
          type = "concert";
        } else if (segment.includes('sports')) {
          type = "sporting";
        } else if (segment.includes('networking')) {
          type = "networking";
        } else if (segment.includes('meetup')) {
          type = "meetup";
        }
        
        // Extract categories
        const categories: string[] = [];
        if (event.classifications?.[0]?.segment?.name) {
          categories.push(event.classifications[0].segment.name);
        }
        if (event.classifications?.[0]?.genre?.name) {
          categories.push(event.classifications[0].genre.name);
        }
        
        // Extract date and time
        const dateObj = event.dates?.start ? new Date(event.dates.start.dateTime) : new Date();
        const date = event.dates?.start?.localDate || dateObj.toISOString().split('T')[0];
        const time = event.dates?.start?.localTime || dateObj.toISOString().split('T')[1]?.substring(0, 5);
        
        // Find the best image (prefer larger images)
        let image: string | undefined;
        if (event.images && event.images.length > 0) {
          // Sort by size (width × height) and take the largest
          const sortedImages = [...event.images].sort((a, b) => 
            (b.width * b.height) - (a.width * a.height)
          );
          image = sortedImages[0].url;
        }
        
        // Map to standardized event format
        return {
          id: event.id,
          title: event.name,
          description: event.description || event.info || 'No description available',
          date,
          time,
          venue: venue?.name,
          location: venue?.address?.line1,
          city: venue?.city?.name,
          state: venue?.state?.name,
          country: venue?.country?.name,
          url: event.url,
          type,
          categories,
          source: "ticketmaster",
          image
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    return [];
  }
}

/**
 * Calculate a relevance score for events based on user preferences
 * @param events Array of networking events to score
 * @param userInterests Array of user interests
 * @param personalityType User's personality type
 * @returns Array of events with relevance scores added
 */
function calculateRelevanceScores(
  events: NetworkingEvent[],
  userInterests: string[],
  personalityType: string
): NetworkingEvent[] {
  // Lowercase all interests for case-insensitive matching
  const interests = userInterests.map(interest => interest.toLowerCase());
  const personality = personalityType.toLowerCase();
  
  // Personality preferences mapping for event types
  const personalityPreferences: Record<string, string[]> = {
    'analytical': ['conference', 'workshop', 'meetup'],
    'creative': ['workshop', 'concert', 'other'],
    'social': ['networking', 'meetup', 'conference'],
    'practical': ['workshop', 'conference', 'networking']
  };
  
  // Calculate preferred event types based on personality
  let preferredTypes: string[] = ['networking', 'conference', 'meetup']; // Default
  
  // Find preferred event types based on personality 
  for (const [key, types] of Object.entries(personalityPreferences)) {
    if (personality.includes(key)) {
      preferredTypes = types;
      break;
    }
  }
  
  return events.map(event => {
    let score = 50; // Base score
    
    // Check title for interest matches (highest weight)
    for (const interest of interests) {
      if (event.title.toLowerCase().includes(interest)) {
        score += 20;
      }
    }
    
    // Check description for interest matches
    for (const interest of interests) {
      if (event.description.toLowerCase().includes(interest)) {
        score += 10;
      }
    }
    
    // Check categories for interest matches
    for (const category of event.categories) {
      for (const interest of interests) {
        if (category.toLowerCase().includes(interest)) {
          score += 15;
        }
      }
    }
    
    // Give bonus for preferred event types based on personality
    if (preferredTypes.includes(event.type)) {
      score += 10;
    }
    
    // Ensure score is within range 0-100
    score = Math.min(100, Math.max(0, score));
    
    return {
      ...event,
      relevanceScore: score
    };
  });
}

/**
 * Get networking events based on user's career profile
 * @param careerInterests User's career interests
 * @param personalityType User's personality type
 * @param location Optional location parameter
 * @returns Promise resolving to array of relevant networking events
 */
export async function getNetworkingEvents(
  careerInterests: string[],
  personalityType: string,
  location?: string
): Promise<NetworkingEvent[]> {
  try {
    console.log(`[NetworkingService] Fetching events for personality: ${personalityType}`);
    console.log(`[NetworkingService] Career interests: ${careerInterests.join(', ')}`);
    
    // Validate input parameters
    if (!careerInterests || careerInterests.length === 0) {
      console.error('[NetworkingService] Error: No career interests provided');
      return [];
    }
    
    if (!personalityType) {
      console.warn('[NetworkingService] Warning: No personality type provided, using default matching');
    }
    
    // Generate keywords based on career interests
    // Add networking-specific terms to the search
    const keywords = [
      ...careerInterests,
      'networking',
      'professional',
      'career',
      'development'
    ];
    
    console.log(`[NetworkingService] Generated search keywords: ${keywords.join(', ')}`);
    
    // Fetch events from both APIs in parallel
    const [eventbriteEvents, ticketmasterEvents] = await Promise.all([
      searchEventbriteEvents(keywords, location),
      searchTicketmasterEvents(keywords, location)
    ]);
    
    console.log(`[NetworkingService] Eventbrite returned ${eventbriteEvents.length} events`);
    console.log(`[NetworkingService] Ticketmaster returned ${ticketmasterEvents.length} events`);
    
    // Combine events from both sources
    const allEvents = [...eventbriteEvents, ...ticketmasterEvents];
    
    if (allEvents.length === 0) {
      console.warn('[NetworkingService] No events found from any source');
      return [];
    }
    
    // Add relevance scores based on user profile
    const scoredEvents = calculateRelevanceScores(
      allEvents,
      careerInterests,
      personalityType
    );
    
    // Sort by relevance score (highest first)
    const sortedEvents = scoredEvents.sort((a, b) => 
      (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
    
    console.log(`[NetworkingService] Returning ${sortedEvents.length} events sorted by relevance`);
    
    return sortedEvents;
  } catch (error) {
    console.error('Error fetching networking events:', error);
    return [];
  }
}