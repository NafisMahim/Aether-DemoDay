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
    
    // Filter out some keywords that are too long or contain special syntax
    const filteredKeywords = interestKeywords.filter(keyword => 
      keyword.length < 50 && 
      !keyword.includes("'re") && 
      !keyword.includes(".")
    );
    
    // Focus on professional/career keywords from the list
    const professionalKeywords = [
      "business", "conference", "workshop", "networking", 
      "professional", "career", "development", "training", 
      "leadership", "management", "human resources", "hr", 
      "community", "healthcare"
    ];
    
    // Combine with user interests but limit to prevent overly complex queries
    const relevantKeywords = [
      ...professionalKeywords,
      ...filteredKeywords.slice(0, 3) // Take just a few user keywords
    ];
    
    // Join keywords for the API query, picking the most relevant ones
    const keywordString = relevantKeywords.slice(0, 5).join(",");
    
    try {
      // Build URL with specific focus on career/networking keywords
      console.log('[Ticketmaster] Making targeted API call for professional events');
      const directUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_KEY}&size=50&keyword=${encodeURIComponent(keywordString)}&sort=date,asc`;
      
      // Log sanitized URL
      const sanitizedUrl = directUrl.replace(TICKETMASTER_KEY, '***');
      console.log(`[Ticketmaster] Direct API URL: ${sanitizedUrl}`);
      
      // Make the request - no extra headers, just like curl
      const response = await axios.get(directUrl);
      
      // Process the response
      if (response.data && response.data._embedded && response.data._embedded.events) {
        const allEvents = response.data._embedded.events;
        console.log(`[Ticketmaster] Successfully fetched ${allEvents.length} events directly`);
        
        // Pre-filter events to exclude obviously irrelevant ones
        const filteredEvents = allEvents.filter((event: TicketmasterEvent) => {
          // Skip sports events
          if (event.classifications?.[0]?.segment?.name === 'Sports') {
            return false;
          }
          
          // Skip concerts and music events
          if (event.classifications?.[0]?.segment?.name === 'Music') {
            return false;
          }
          
          // Skip entertainment events that aren't professional
          const name = event.name?.toLowerCase() || '';
          if (
            (name.includes('game') || 
             name.includes('concert') || 
             name.includes('festival') || 
             name.includes('championship')) && 
            !name.includes('business') && 
            !name.includes('career') && 
            !name.includes('professional')
          ) {
            return false;
          }
          
          return true;
        });
        
        console.log(`[Ticketmaster] Filtered down to ${filteredEvents.length} relevant professional events`);
        
        // Process and return the filtered events
        return processTicketmasterEvents(filteredEvents);
      } else {
        console.log('[Ticketmaster] No events found in direct API response');
      }
    } catch (directError: any) {
      console.error(`[Ticketmaster] Direct API call failed: ${directError.message}`);
      if (directError.response) {
        console.error(`[Ticketmaster] Status: ${directError.response.status}`);
        console.error(`[Ticketmaster] Data:`, directError.response.data);
      }
    }
    
    // If we get here, we couldn't get events through the API
    console.log('[Ticketmaster] Could not retrieve events from Ticketmaster API');
    return [];
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    return [];
  }
}

// Helper function to process Ticketmaster events
function processTicketmasterEvents(events: TicketmasterEvent[]): NetworkingEvent[] {
  return events.map((event: TicketmasterEvent) => {
    try {
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
      
      // Extract date and time (with safer handling)
      let date = new Date().toISOString().split('T')[0]; // Default to today
      let time = "12:00"; // Default time
      
      // Try to get date information from the event
      if (event.dates?.start?.localDate) {
        date = event.dates.start.localDate;
      }
      
      if (event.dates?.start?.localTime) {
        time = event.dates.start.localTime.substring(0, 5);
      }
      
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
    } catch (error) {
      console.error('[NetworkingService] Error processing event:', error);
      
      // Return a minimal valid event in case of processing error
      return {
        id: event.id || `error-${Date.now()}`,
        title: event.name || 'Event',
        description: 'Event details unavailable',
        date: new Date().toISOString().split('T')[0],
        url: event.url || '#',
        type: 'other',
        categories: [],
        source: 'ticketmaster',
      };
    }
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
  // Define career-related keywords for stronger filtering
  const careerKeywords = [
    'business', 'conference', 'leadership', 'professional', 'career', 
    'development', 'training', 'workshop', 'networking', 'education',
    'management', 'human resources', 'hr', 'community', 'healthcare',
    'innovation', 'entrepreneurship', 'technology', 'communication'
  ];
  
  // Lowercase all interests for case-insensitive matching
  const interests = userInterests
    .map(interest => interest.toLowerCase())
    .filter(interest => interest.length < 50); // Filter out very long interests
  
  const personality = personalityType.toLowerCase();
  
  // Personality preferences mapping for event types
  const personalityPreferences: Record<string, string[]> = {
    'analytical': ['conference', 'workshop', 'meetup'],
    'creative': ['workshop', 'meetup', 'networking'],
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
  
  const scoredEvents = events.map(event => {
    let score = 40; // Start with a lower base score
    let careerRelevance = false;
    
    // Check for career relevance in title and description
    const title = event.title.toLowerCase();
    const description = event.description.toLowerCase();
    
    // Strongly penalize sports, concerts and entertainment events
    if (
      (title.includes('sports') || 
       title.includes('game') || 
       title.includes('concert') || 
       title.includes('music') || 
       title.includes('festival') || 
       title.includes('championship')) &&
      !(title.includes('business') || 
        title.includes('career') || 
        title.includes('professional') ||
        title.includes('conference'))
    ) {
      score -= 30;
    }
    
    // Check title for career keyword matches (highest weight)
    for (const keyword of careerKeywords) {
      if (title.includes(keyword)) {
        score += 15;
        careerRelevance = true;
      }
    }
    
    // Check description for career keyword matches
    for (const keyword of careerKeywords) {
      if (description.includes(keyword)) {
        score += 8;
        careerRelevance = true;
      }
    }
    
    // Check title for interest matches
    for (const interest of interests) {
      if (title.includes(interest)) {
        score += 12;
      }
    }
    
    // Check description for interest matches
    for (const interest of interests) {
      if (description.includes(interest)) {
        score += 6;
      }
    }
    
    // Check categories for career and interest matches
    for (const category of event.categories) {
      const lowercaseCategory = category.toLowerCase();
      
      // Check for career relevance
      for (const keyword of careerKeywords) {
        if (lowercaseCategory.includes(keyword)) {
          score += 10;
          careerRelevance = true;
        }
      }
      
      // Check for interest matches
      for (const interest of interests) {
        if (lowercaseCategory.includes(interest)) {
          score += 8;
        }
      }
    }
    
    // Give bonus for preferred event types based on personality
    if (preferredTypes.includes(event.type)) {
      score += 10;
    }
    
    // Major bonus for events with obvious career relevance
    if (careerRelevance) {
      score += 20;
    } else {
      score -= 20; // Penalty for non-career events
    }
    
    // Ensure score is within range 0-100
    score = Math.min(100, Math.max(0, score));
    
    return {
      ...event,
      relevanceScore: score
    };
  });
  
  // Filter out very low scoring events (likely not career-related)
  return scoredEvents.filter(event => event.relevanceScore >= 40);
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