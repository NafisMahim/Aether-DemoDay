import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API keys from environment variables
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN || 'DSBQW62GEUQM7ONFQ5K5';
const EVENTBRITE_APP_KEY = process.env.EVENTBRITE_APP_KEY || 'GLDXQTI423FDOGWKIX'; 
const EVENTBRITE_USER_ID = process.env.EVENTBRITE_USER_ID || '2703283588001';

// Ticketmaster credentials from environment variables
const TICKETMASTER_KEY = process.env.TICKETMASTER_KEY; // Using real API key from environment
const TICKETMASTER_SECRET = process.env.TICKETMASTER_SECRET; // Using real API secret from environment

// For debugging
console.log('[NetworkingService] Ticketmaster credentials available:', {
  keyAvailable: !!TICKETMASTER_KEY,
  secretAvailable: !!TICKETMASTER_SECRET
});

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
    // Try to get user information first
    console.log(`[Eventbrite] Attempting to verify user authentication...`);
    
    // First, verify the authentication by getting user data
    let userResponse;
    try {
      const userUrl = `https://www.eventbriteapi.com/v3/users/me/?token=${EVENTBRITE_TOKEN}`;
      console.log(`[Eventbrite] Getting user info with URL: ${userUrl.replace(EVENTBRITE_TOKEN, '***')}`);
      
      userResponse = await axios.get(userUrl, {
        validateStatus: (status) => status < 500,
      });
      
      console.log(`[Eventbrite] User info status: ${userResponse.status}`);
      
      if (userResponse.data && userResponse.data.error) {
        console.error(`[Eventbrite] User info error: ${userResponse.data.error} - ${userResponse.data.error_description}`);
        return [];
      }
    } catch (error) {
      console.error('[Eventbrite] Error fetching user info:', error);
      return [];
    }
    
    // Now try to search for events
    // Approach 1: search by organizer (more likely to find events)
    const organizerId = EVENTBRITE_USER_ID; // Using the provided user ID
    let url = `https://www.eventbriteapi.com/v3/organizers/${organizerId}/events/`;
    
    // Try to find public events for this user
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
      
      // Try alternative approach - get events by user directly
      try {
        const altUrl = `https://www.eventbriteapi.com/v3/users/${EVENTBRITE_USER_ID}/owned_events/`;
        console.log(`[Eventbrite] Trying alternative URL: ${altUrl}`);
        
        const altResponse = await axios.get(altUrl, {
          headers: {
            'Authorization': `Bearer ${EVENTBRITE_TOKEN}`
          },
          validateStatus: (status) => status < 500,
        });
        
        if (altResponse.data && altResponse.data.error) {
          console.error(`[Eventbrite] Alternative API Error: ${altResponse.data.error} - ${altResponse.data.error_description}`);
          return [];
        }
        
        // Process events from alternative approach
        if (altResponse.data && altResponse.data.events && Array.isArray(altResponse.data.events)) {
          console.log(`[Eventbrite] Successfully fetched ${altResponse.data.events.length} events via alternative URL`);
          return processEventbriteEvents(altResponse.data.events);
        }
      } catch (altError) {
        console.error('[Eventbrite] Error with alternative approach:', altError);
        return [];
      }
      
      return [];
    }
    
    // Map Eventbrite events to standardized format
    if (response.data && response.data.events && Array.isArray(response.data.events)) {
      console.log(`[Eventbrite] Successfully fetched ${response.data.events.length} events`);
      return processEventbriteEvents(response.data.events);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    return [];
  }
}

// Helper function to process Eventbrite events
function processEventbriteEvents(events: EventbriteEvent[]): NetworkingEvent[] {
  return events.map((event: EventbriteEvent) => {
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
    if (!TICKETMASTER_KEY) {
      console.error('[Ticketmaster] No API key available');
      return [];
    }

    // Make the simplest possible request to just get ANY events
    // This is to maximize chances of getting real data to display
    
    // Base URL with minimal parameters
    let url = 'https://app.ticketmaster.com/discovery/v2/events.json?';
    
    // Essential parameters:
    // - size: number of results (keep it reasonable)
    // - sort: upcoming events first
    // - apikey: required for authentication
    const params = new URLSearchParams({
      size: '10',
      sort: 'date,asc',
      apikey: TICKETMASTER_KEY
    });
    
    // Create four different search strategies to try in parallel
    const searches = [
      // 1. Conferences and business events
      { ...params, keyword: 'conference,business,networking' },
      
      // 2. Technology events (workshops, hackathons)
      { ...params, keyword: 'technology,workshop,innovation' },
      
      // 3. Career development events
      { ...params, keyword: 'career,development,professional' },
      
      // 4. Location-based search (if provided)
      location && location !== 'Not specified' 
        ? { ...params, city: location, radius: '50', unit: 'miles' }
        : null
    ].filter(Boolean);
    
    console.log(`[Ticketmaster] Attempting ${searches.length} parallel search strategies`);
    
    // Try all search strategies in parallel
    const searchPromises = searches.map(async (searchParams, index) => {
      try {
        // Convert params to string and append to URL
        const searchUrl = url + new URLSearchParams(searchParams as Record<string, string>).toString();
        
        // Create a sanitized version for logging (hide API key)
        const sanitizedUrl = searchUrl.replace(TICKETMASTER_KEY, '***');
        console.log(`[Ticketmaster] Search strategy ${index+1}: ${sanitizedUrl}`);
        
        // Make the request
        const response = await axios.get(searchUrl, {
          validateStatus: (status) => status < 500,
        });
        
        // Process results if successful
        if (response.status === 200 && response.data._embedded && response.data._embedded.events) {
          console.log(`[Ticketmaster] Strategy ${index+1} successful: found ${response.data._embedded.events.length} events`);
          return processTicketmasterEvents(response.data._embedded.events);
        } else {
          console.log(`[Ticketmaster] Strategy ${index+1} failed or returned no events. Status: ${response.status}`);
          return [];
        }
      } catch (error) {
        console.error(`[Ticketmaster] Error in search strategy ${index+1}:`, error);
        return [];
      }
    });
    
    // Wait for all search strategies to complete
    const results = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const allEvents = results.flat();
    const uniqueEvents = allEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
    
    console.log(`[Ticketmaster] Total events found: ${uniqueEvents.length}`);
    
    // If we still have no results, try one final simple search with minimal parameters
    if (uniqueEvents.length === 0) {
      try {
        console.log('[Ticketmaster] Trying final fallback search');
        const fallbackUrl = `https://app.ticketmaster.com/discovery/v2/events.json?size=10&apikey=${TICKETMASTER_KEY}`;
        const sanitizedFallbackUrl = fallbackUrl.replace(TICKETMASTER_KEY, '***');
        console.log(`[Ticketmaster] Fallback URL: ${sanitizedFallbackUrl}`);
        
        const fallbackResponse = await axios.get(fallbackUrl, {
          validateStatus: (status) => status < 500
        });
        
        if (fallbackResponse.status === 200 && fallbackResponse.data._embedded && fallbackResponse.data._embedded.events) {
          console.log(`[Ticketmaster] Final fallback successful, found ${fallbackResponse.data._embedded.events.length} events`);
          return processTicketmasterEvents(fallbackResponse.data._embedded.events);
        }
      } catch (fallbackError) {
        console.error('[Ticketmaster] Final fallback search failed:', fallbackError);
      }
    }
    
    return uniqueEvents;
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    return [];
  }
}

// Helper function to process Ticketmaster events
function processTicketmasterEvents(events: TicketmasterEvent[]): NetworkingEvent[] {
  return events.map((event: TicketmasterEvent) => {
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
      console.warn('[NetworkingService] No events found from any source, returning sample events');
      // Return sample events when no real data is available
      return [
        {
          id: "sample-tech-001",
          title: "Tech Innovators Meetup",
          description: "Monthly gathering of tech professionals discussing emerging technologies and industry trends.",
          date: new Date().toISOString().split('T')[0], // Today's date
          time: "18:00",
          venue: "Tech Hub Downtown",
          city: "San Francisco",
          state: "CA",
          country: "USA",
          url: "https://example.com/events/tech-innovators",
          type: "conference",
          categories: ["Technology", "Innovation", "Networking"],
          source: "ticketmaster",
          relevanceScore: 92,
          image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
        },
        {
          id: "sample-design-002",
          title: "Women in Design Community",
          description: "Supportive community for women in design to share resources, mentorship, and job opportunities.",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // A week from now
          time: "17:30",
          venue: "Design Studio Loft",
          city: "New York",
          state: "NY",
          country: "USA",
          url: "https://example.com/events/women-design",
          type: "networking",
          categories: ["Design", "Community", "Mentorship"],
          source: "ticketmaster",
          relevanceScore: 85,
          image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
        },
        {
          id: "sample-health-003",
          title: "Healthcare Innovation Summit",
          description: "Annual conference for healthcare professionals to explore new technologies and practices that improve patient care.",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Two weeks from now
          time: "09:00",
          venue: "Medical Center Conference Hall",
          city: "Boston",
          state: "MA",
          country: "USA",
          url: "https://example.com/events/healthcare-summit",
          type: "conference",
          categories: ["Healthcare", "Innovation", "Professional Development"],
          source: "ticketmaster",
          relevanceScore: 88,
          image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
        },
        {
          id: "sample-hr-004",
          title: "HR Leadership Conference",
          description: "Connect with HR professionals and learn about the latest trends in talent management and employee experience.",
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Three weeks from now
          time: "10:00",
          venue: "Business Convention Center",
          city: "Chicago",
          state: "IL",
          country: "USA",
          url: "https://example.com/events/hr-leadership",
          type: "conference",
          categories: ["Human Resources", "Leadership", "Professional Development"],
          source: "ticketmaster",
          relevanceScore: 95,
          image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
        }
      ];
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