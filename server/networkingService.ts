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
    
    // Career-focused search strategies - from specific to general
    const searchStrategies = [
      // Strategy 1: Business and conference focus
      {
        keywords: "business,conference,professional",
        size: 20
      },
      // Strategy 2: Workshop and training focus
      {
        keywords: "workshop,training,leadership",
        size: 20
      },
      // Strategy 3: Networking specific
      {
        keywords: "networking,career,professional",
        size: 20
      },
      // Strategy 4: Human resources
      {
        keywords: "human resources,career,management",
        size: 20
      },
      // Strategy 5: General events (fallback)
      {
        keywords: "",
        size: 30
      }
    ];
    
    // Attempt all strategies and collect results
    let allEvents: TicketmasterEvent[] = [];
    
    // Try each search strategy in sequence until we get results
    for (const [index, strategy] of searchStrategies.entries()) {
      try {
        // Build URL based on strategy
        console.log(`[Ticketmaster] Trying search strategy ${index + 1}`);
        
        // Build query parameters
        const params = new URLSearchParams({
          apikey: TICKETMASTER_KEY,
          size: strategy.size.toString(),
          sort: 'date,asc'
        });
        
        // Add keywords if present
        if (strategy.keywords) {
          params.append('keyword', strategy.keywords);
        }
        
        const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
        
        // Log sanitized URL
        const sanitizedUrl = apiUrl.replace(TICKETMASTER_KEY, '***');
        console.log(`[Ticketmaster] API URL: ${sanitizedUrl}`);
        
        // Make the request with timeout
        const response = await axios.get(apiUrl, { timeout: 5000 });
        
        // Check for events
        if (response.data && response.data._embedded && response.data._embedded.events) {
          const events = response.data._embedded.events;
          console.log(`[Ticketmaster] Strategy ${index + 1} found ${events.length} events`);
          
          // We got results, add them to our collection
          allEvents = [...allEvents, ...events];
          
          // If we have enough events already, break early
          if (allEvents.length >= 30) {
            console.log('[Ticketmaster] Found enough events, stopping search');
            break;
          }
        } else {
          console.log(`[Ticketmaster] Strategy ${index + 1} found no events`);
        }
      } catch (strategyError: any) {
        console.error(`[Ticketmaster] Strategy ${index + 1} failed: ${strategyError.message}`);
      }
    }
    
    console.log(`[Ticketmaster] Total events found across all strategies: ${allEvents.length}`);
    
    if (allEvents.length === 0) {
      console.log('[Ticketmaster] No events found from any search strategy');
      return [];
    }
    
    // Process all events we found
    return processTicketmasterEvents(allEvents);
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
      console.warn('[NetworkingService] No events found from any source, generating personalized sample events');
      
      // Create sample events tailored to the user's career profile
      const sampleEvents: NetworkingEvent[] = [];
      
      // Base each sample on the user's personality and career interests
      const personality = personalityType.toLowerCase();
      let careerFocus = 'general';
      
      // Determine primary career focus based on interests
      if (careerInterests.some(i => i.toLowerCase().includes('human resource') || i.toLowerCase().includes('hr'))) {
        careerFocus = 'hr';
      } else if (careerInterests.some(i => i.toLowerCase().includes('health') || i.toLowerCase().includes('care'))) {
        careerFocus = 'healthcare';
      } else if (careerInterests.some(i => i.toLowerCase().includes('tech') || i.toLowerCase().includes('software'))) {
        careerFocus = 'tech';
      } else if (careerInterests.some(i => i.toLowerCase().includes('design') || i.toLowerCase().includes('creative'))) {
        careerFocus = 'design';
      } else if (careerInterests.some(i => i.toLowerCase().includes('community') || i.toLowerCase().includes('social'))) {
        careerFocus = 'community';
      }
      
      console.log(`[NetworkingService] Generating sample events focused on: ${careerFocus}`);
      
      // Based on career focus, generate tailored sample events
      switch (careerFocus) {
        case 'hr':
          sampleEvents.push({
            id: "sample-hr-001",
            title: "HR Leadership & Innovation Conference",
            description: "Connect with HR professionals and learn about the latest trends in talent management, employee experience, and organizational development. Featuring workshops on diversity & inclusion strategies and effective change management.",
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "09:00",
            venue: "Professional Development Center",
            city: "Chicago",
            state: "IL",
            country: "USA",
            url: "https://example.com/events/hr-leadership",
            type: "conference",
            categories: ["Human Resources", "Leadership", "Professional Development"],
            source: "generated",
            relevanceScore: 95,
            image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          });
          sampleEvents.push({
            id: "sample-hr-002",
            title: "Diversity & Inclusion Workshop Series",
            description: "A comprehensive workshop series focusing on implementing effective diversity and inclusion strategies in the workplace. Includes practical sessions on building inclusive recruitment processes and fostering belonging.",
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "10:00",
            venue: "Executive Training Center",
            city: "New York",
            state: "NY",
            country: "USA",
            url: "https://example.com/events/diversity-inclusion-workshop",
            type: "workshop",
            categories: ["Human Resources", "Diversity & Inclusion", "Professional Development"],
            source: "generated",
            relevanceScore: 92,
            image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1169&q=80"
          });
          break;
          
        case 'healthcare':
          sampleEvents.push({
            id: "sample-health-001",
            title: "Healthcare Program Management Summit",
            description: "Annual conference for healthcare administrators and program managers focusing on improving patient care systems, healthcare operations efficiency, and innovative management approaches in medical settings.",
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "08:30",
            venue: "Medical Center Conference Hall",
            city: "Boston",
            state: "MA",
            country: "USA",
            url: "https://example.com/events/healthcare-management-summit",
            type: "conference",
            categories: ["Healthcare", "Management", "Professional Development"],
            source: "generated",
            relevanceScore: 94,
            image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          });
          sampleEvents.push({
            id: "sample-health-002",
            title: "Healthcare Leadership Networking Event",
            description: "Monthly networking event connecting healthcare professionals in leadership and administrative roles. Share best practices, discuss industry challenges, and build valuable professional relationships.",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "18:00",
            venue: "City Medical Association",
            city: "San Francisco",
            state: "CA",
            country: "USA",
            url: "https://example.com/events/healthcare-networking",
            type: "networking",
            categories: ["Healthcare", "Leadership", "Networking"],
            source: "generated",
            relevanceScore: 91,
            image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          });
          break;
          
        case 'community':
          sampleEvents.push({
            id: "sample-community-001",
            title: "Community Operations Managers Conference",
            description: "The premier conference for community operations professionals focusing on building sustainable community programs, measuring impact, and developing effective engagement strategies.",
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "09:30",
            venue: "Community Center",
            city: "Portland",
            state: "OR",
            country: "USA",
            url: "https://example.com/events/community-operations",
            type: "conference",
            categories: ["Community Management", "Operations", "Engagement"],
            source: "generated",
            relevanceScore: 93,
            image: "https://images.unsplash.com/photo-1544531585-9847b68c8c86?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          });
          sampleEvents.push({
            id: "sample-community-002",
            title: "Social Impact Leadership Forum",
            description: "Connect with professionals focused on creating social impact through effective community programs, non-profit management, and human-centered program design.",
            date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "13:00",
            venue: "Civic Engagement Center",
            city: "Seattle",
            state: "WA",
            country: "USA",
            url: "https://example.com/events/social-impact-forum",
            type: "networking",
            categories: ["Social Impact", "Community", "Leadership"],
            source: "generated",
            relevanceScore: 90,
            image: "https://images.unsplash.com/photo-1559024094-4a0b775234e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          });
          break;
          
        default:
          // General professional events for all careers
          sampleEvents.push({
            id: "sample-prof-001",
            title: "Professional Development & Leadership Summit",
            description: "Comprehensive summit featuring expert speakers on career advancement, leadership skills, and professional relationship building. Includes workshops on effective communication and team management.",
            date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "09:00",
            venue: "Business Conference Center",
            city: "Chicago",
            state: "IL",
            country: "USA",
            url: "https://example.com/events/professional-development-summit",
            type: "conference",
            categories: ["Professional Development", "Leadership", "Career Advancement"],
            source: "generated",
            relevanceScore: 89,
            image: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          });
          sampleEvents.push({
            id: "sample-prof-002",
            title: "Career Networking Masterclass",
            description: "Learn the art of effective professional networking in this interactive masterclass. Develop strategies for building meaningful connections, maintaining professional relationships, and leveraging your network for career growth.",
            date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "18:00",
            venue: "Professional Development Institute",
            city: "New York",
            state: "NY",
            country: "USA",
            url: "https://example.com/events/networking-masterclass",
            type: "workshop",
            categories: ["Career Development", "Networking", "Professional Skills"],
            source: "generated",
            relevanceScore: 87,
            image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80"
          });
      }
      
      // Add a personality-specific event
      if (personality.includes('social')) {
        sampleEvents.push({
          id: "sample-social-001",
          title: "Building Relationships: Social Intelligence in the Workplace",
          description: "Workshop designed for socially-oriented professionals looking to leverage their interpersonal strengths in professional settings. Learn to enhance team dynamics, improve communication, and build stronger workplace relationships.",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: "10:00",
          venue: "Professional Development Center",
          city: "San Francisco",
          state: "CA",
          country: "USA",
          url: "https://example.com/events/social-intelligence-workshop",
          type: "workshop",
          categories: ["Interpersonal Skills", "Communication", "Team Building"],
          source: "generated",
          relevanceScore: 96,
          image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
        });
      } else if (personality.includes('analytical')) {
        sampleEvents.push({
          id: "sample-analytical-001",
          title: "Data-Driven Decision Making Conference",
          description: "Conference focused on using analytical approaches to solve business problems and make strategic decisions. Includes workshops on data analysis, critical thinking, and implementing evidence-based strategies.",
          date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: "09:00",
          venue: "Technology Innovation Center",
          city: "Boston",
          state: "MA",
          country: "USA",
          url: "https://example.com/events/analytical-conference",
          type: "conference",
          categories: ["Data Analysis", "Critical Thinking", "Decision Making"],
          source: "generated",
          relevanceScore: 90,
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
        });
      }
      
      // Add a general career networking event
      sampleEvents.push({
        id: "sample-career-001",
        title: "Professional Networking Mixer",
        description: "Monthly networking event bringing together professionals from various industries for meaningful connections and conversation. Perfect opportunity to expand your professional network in a relaxed setting.",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "18:30",
        venue: "Metropolitan Business Club",
        city: "New York",
        state: "NY",
        country: "USA",
        url: "https://example.com/events/professional-mixer",
        type: "networking",
        categories: ["Networking", "Professional Development", "Career"],
        source: "generated",
        relevanceScore: 88,
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
      });
      
      return sampleEvents;
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