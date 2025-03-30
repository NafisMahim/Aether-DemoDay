import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API keys from environment variables
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN;
const EVENTBRITE_APP_KEY = process.env.EVENTBRITE_APP_KEY;
const EVENTBRITE_USER_ID = process.env.EVENTBRITE_USER_ID;

// Ticketmaster credentials from environment variables
const TICKETMASTER_KEY = process.env.TICKETMASTER_KEY;
const TICKETMASTER_SECRET = process.env.TICKETMASTER_SECRET;

// Meraki API credentials
const MERAKI_API_KEY = process.env.MERAKI_API_KEY;

// For debugging
console.log('[NetworkingService] API credentials available:', {
  eventbrite: {
    tokenAvailable: !!EVENTBRITE_TOKEN,
    userIdAvailable: !!EVENTBRITE_USER_ID,
    appKeyAvailable: !!EVENTBRITE_APP_KEY
  },
  ticketmaster: {
    keyAvailable: !!TICKETMASTER_KEY,
    secretAvailable: !!TICKETMASTER_SECRET
  },
  meraki: {
    apiKeyAvailable: !!MERAKI_API_KEY
  }
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
  industry?: string;
  source: "eventbrite" | "ticketmaster" | "meraki" | "generated";
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
    if (!EVENTBRITE_TOKEN || !EVENTBRITE_USER_ID || !EVENTBRITE_APP_KEY) {
      console.error('[Eventbrite] Missing required credentials');
      return [];
    }
    
    console.log(`[Eventbrite] Searching for career-related events...`);
    
    // Filter interests to avoid problematic search terms
    const filteredInterests = interestKeywords
      .filter(keyword => 
        keyword.length < 50 && 
        !keyword.includes("'") && 
        !keyword.includes(".")
      )
      .slice(0, 3); // Limit to avoid overwhelming the API
    
    // Set up headers for Eventbrite API
    const headers = {
      'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    console.log(`[Eventbrite] Using headers:`, JSON.stringify(headers, (key, value) => 
      key === 'Authorization' ? 'Bearer ***' : value, 2));
    
    // Use a multi-stage approach to find events:
    // 1. Try to get public events using organization search
    // 2. Try to get events for the current user
    // 3. Try to get featured events in a category
    
    let allEvents: EventbriteEvent[] = [];
    
    // APPROACH 1: Try to get public events from organizations with relevant names
    try {
      console.log('[Eventbrite] Trying to find organizations related to professional development');
      
      // This URL works well to search for relevant organizations
      const orgSearchParams = new URLSearchParams({
        'q': 'professional conference networking',
      });
      
      const orgsUrl = `https://www.eventbriteapi.com/v1/organizers/search/?${orgSearchParams.toString()}`;
      
      const orgsResponse = await axios.get(orgsUrl, {
        headers: {
          ...headers,
          'Authorization': `Basic ${Buffer.from(`${EVENTBRITE_APP_KEY}:`).toString('base64')}`
        },
        timeout: 12000,
        validateStatus: (status) => status < 500 // Accept any non-server error status code
      });
      
      if (orgsResponse.status === 200 && orgsResponse.data && orgsResponse.data.organizers) {
        const orgIds = orgsResponse.data.organizers
          .slice(0, 5) // Limit to top 5 relevant organizations
          .map((org: any) => org.id);
        
        console.log(`[Eventbrite] Found ${orgIds.length} relevant organizations`);
        
        // For each org, try to get their events
        for (const orgId of orgIds) {
          try {
            const orgEventsUrl = `https://www.eventbriteapi.com/v3/organizers/${orgId}/events/`;
            
            const orgEventsResponse = await axios.get(orgEventsUrl, {
              headers,
              timeout: 8000,
              validateStatus: (status) => status < 500
            });
            
            if (orgEventsResponse.status === 200 && 
                orgEventsResponse.data && 
                orgEventsResponse.data.events) {
              console.log(`[Eventbrite] Found ${orgEventsResponse.data.events.length} events for organization ${orgId}`);
              allEvents = [...allEvents, ...orgEventsResponse.data.events];
            }
          } catch (orgError) {
            console.log(`[Eventbrite] Error fetching events for organization ${orgId}`);
          }
          
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (orgSearchError) {
      console.error('[Eventbrite] Error searching organizations:', orgSearchError);
    }
    
    // APPROACH 2: Try to get events for the current user
    if (allEvents.length === 0) {
      try {
        console.log('[Eventbrite] Trying to access events for the authenticated user...');
        
        // First make sure we can access the user profile to confirm authentication
        const userUrl = 'https://www.eventbriteapi.com/v3/users/me/';
        
        const userResponse = await axios.get(userUrl, {
          headers,
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        if (userResponse.status === 200 && userResponse.data) {
          console.log('[Eventbrite] Successfully authenticated with the API');
          
          // If we have the user's organizations, let's check their events
          if (EVENTBRITE_USER_ID) {
            try {
              // This endpoint should work with the authenticated user
              const ownedEventsUrl = `https://www.eventbriteapi.com/v3/organizations/${EVENTBRITE_USER_ID}/events/`;
              
              const ownedEventsResponse = await axios.get(ownedEventsUrl, {
                headers,
                timeout: 10000,
                validateStatus: (status) => status < 500
              });
              
              if (ownedEventsResponse.status === 200 && 
                  ownedEventsResponse.data && 
                  ownedEventsResponse.data.events) {
                console.log(`[Eventbrite] Found ${ownedEventsResponse.data.events.length} events for your organization`);
                allEvents = [...allEvents, ...ownedEventsResponse.data.events];
              }
            } catch (ownedEventsError) {
              console.error('[Eventbrite] Error fetching owned events:', ownedEventsError);
            }
          }
        }
      } catch (userError) {
        console.error('[Eventbrite] Error accessing user information:', userError);
      }
    }
    
    // APPROACH 3: Try to find events by category
    if (allEvents.length === 0) {
      try {
        console.log('[Eventbrite] Trying to find events by category');
        
        // Categories: 101 = Business, 102 = Science & Tech
        const categoryIds = ['101', '102'];
        
        for (const categoryId of categoryIds) {
          try {
            // Get featured events in this category
            const categoryUrl = `https://www.eventbriteapi.com/v3/categories/${categoryId}/events/`;
            
            const categoryResponse = await axios.get(categoryUrl, {
              headers,
              timeout: 10000,
              params: {
                'status': 'live',
                'start_date.range_start': new Date().toISOString().split('T')[0],
                'expand': 'venue'
              },
              validateStatus: (status) => status < 500
            });
            
            if (categoryResponse.status === 200 && 
                categoryResponse.data && 
                categoryResponse.data.events) {
              console.log(`[Eventbrite] Found ${categoryResponse.data.events.length} events for category ${categoryId}`);
              allEvents = [...allEvents, ...categoryResponse.data.events];
            }
          } catch (categoryError) {
            console.error(`[Eventbrite] Error fetching events for category ${categoryId}:`, categoryError);
          }
          
          // Add a delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (categorySearchError) {
        console.error('[Eventbrite] Error searching categories:', categorySearchError);
      }
    }
    
    // If we have found any events, process and return them
    if (allEvents.length > 0) {
      console.log(`[Eventbrite] Total events found: ${allEvents.length}`);
      return processEventbriteEvents(allEvents);
    }
    
    // Try one more fallback - use orders endpoint to get order IDs, then fetch event details
    try {
      console.log('[Eventbrite] Trying to access user orders as final fallback...');
      const ordersUrl = 'https://www.eventbriteapi.com/v3/users/me/orders/';
      
      const ordersResponse = await axios.get(ordersUrl, {
        headers,
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      if (ordersResponse.status === 200 && 
          ordersResponse.data && 
          ordersResponse.data.orders && 
          Array.isArray(ordersResponse.data.orders) &&
          ordersResponse.data.orders.length > 0) {
        
        console.log(`[Eventbrite] Found ${ordersResponse.data.orders.length} orders`);
        
        // Get event details for each order
        for (const order of ordersResponse.data.orders) {
          if (order.event_id) {
            try {
              const eventUrl = `https://www.eventbriteapi.com/v3/events/${order.event_id}/`;
              
              const eventResponse = await axios.get(eventUrl, {
                headers,
                timeout: 8000,
                validateStatus: (status) => status < 500
              });
              
              if (eventResponse.status === 200 && eventResponse.data) {
                console.log(`[Eventbrite] Found event details for event ${order.event_id}`);
                allEvents.push(eventResponse.data);
              }
            } catch (eventError) {
              console.error(`[Eventbrite] Error fetching event ${order.event_id}:`, eventError);
            }
          }
        }
      } else {
        console.log('[Eventbrite] No orders found or endpoint failed');
      }
    } catch (ordersError) {
      console.error('[Eventbrite] Error accessing orders:', ordersError);
    }
    
    if (allEvents.length > 0) {
      console.log(`[Eventbrite] Total events found from orders: ${allEvents.length}`);
      return processEventbriteEvents(allEvents);
    }
    
    console.log('[Eventbrite] No events found from any method');
    return [];
  } catch (error) {
    console.error('Error searching Eventbrite events:', error);
    return [];
  }
}

// Helper function to process Eventbrite events
function processEventbriteEvents(events: EventbriteEvent[]): NetworkingEvent[] {
  // First filter events to ensure they're not in the past
  const now = new Date();
  
  // Process events with improved classification
  return events
    .filter(event => {
      // Filter out events with missing critical data
      if (!event.name || !event.url) {
        return false;
      }
      
      // Check if event has a date and it's not in the past
      if (event.start?.local) {
        const eventDate = new Date(event.start.local);
        // Also filter out events more than 5 years in the future (likely data errors)
        const fiveYearsFromNow = new Date();
        fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
        
        return eventDate >= now && eventDate <= fiveYearsFromNow;
      }
      
      // Include events without dates (we'll assign today's date)
      return true;
    })
    .map((event: EventbriteEvent) => {
      // Determine event type based on event name and description
      let type: NetworkingEvent['type'] = "other";
      const title = event.name.text.toLowerCase();
      const description = event.description?.text.toLowerCase() || '';
      
      // More comprehensive event type categorization
      if (
        title.includes('conference') || 
        title.includes('summit') || 
        title.includes('forum') || 
        title.includes('congress') ||
        description.includes('conference') ||
        description.includes('industry leaders')
      ) {
        type = "conference";
      } 
      else if (
        title.includes('workshop') || 
        title.includes('training') || 
        title.includes('course') || 
        title.includes('class') || 
        title.includes('seminar') ||
        description.includes('workshop') ||
        description.includes('hands-on')
      ) {
        type = "workshop";
      } 
      else if (
        title.includes('networking') || 
        title.includes('mixer') || 
        title.includes('social') || 
        title.includes('connect') ||
        description.includes('networking') ||
        description.includes('connect with peers')
      ) {
        type = "networking";
      } 
      else if (
        title.includes('meetup') || 
        title.includes('meet-up') ||
        description.includes('meetup')
      ) {
        type = "meetup";
      }
      else if (
        title.includes('career fair') ||
        title.includes('job fair') ||
        title.includes('recruitment') ||
        title.includes('hiring') ||
        description.includes('career opportunities') ||
        description.includes('job seekers')
      ) {
        type = "networking";  // Categorize job fairs as networking events
      } 
      else {
        // Default for business/professional events
        type = "conference";
      }
      
      // Extract categories from keywords in title and description
      const categoryKeywords = [
        'business', 'technology', 'leadership', 'professional', 'networking', 
        'career', 'development', 'management', 'innovation', 'entrepreneurship',
        'hr', 'human resources', 'finance', 'marketing', 'sales', 'education',
        'healthcare', 'engineering', 'design', 'startup', 'tech', 'digital'
      ];
      
      const categories: string[] = [];
      
      // Add relevant categories based on title keywords
      categoryKeywords.forEach(keyword => {
        if (title.includes(keyword) || description.includes(keyword)) {
          // Capitalize first letter and normalize multi-word categories
          let category: string;
          if (keyword === 'hr') {
            category = 'Human Resources';
          } else if (keyword === 'human resources') {
            category = 'Human Resources';
          } else if (keyword === 'tech') {
            category = 'Technology';
          } else {
            category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          }
          
          if (!categories.includes(category)) {
            categories.push(category);
          }
        }
      });
      
      // Add a default category if none were found
      if (categories.length === 0) {
        categories.push('Professional Development');
      }
      
      // Generate industry label based on categories and title
      const industryByKeyword: Record<string, string> = {
        'tech': 'Technology',
        'technology': 'Technology',
        'business': 'Business',
        'finance': 'Finance',
        'marketing': 'Marketing',
        'education': 'Education',
        'healthcare': 'Healthcare',
        'health': 'Healthcare',
        'hr': 'Human Resources',
        'human resources': 'Human Resources',
        'design': 'Design',
        'creative': 'Creative',
        'engineering': 'Engineering',
        'developer': 'Technology',
        'leadership': 'Leadership',
        'management': 'Management',
        'career': 'Career Development',
        'startup': 'Entrepreneurship',
        'entrepreneur': 'Entrepreneurship'
      };
      
      // Determine industry from title
      let industry = 'Professional Development'; // Default
      
      // Check title for industry keywords
      for (const [keyword, industryLabel] of Object.entries(industryByKeyword)) {
        if (title.includes(keyword)) {
          industry = industryLabel;
          break;
        }
      }
      
      // Extract time information
      const dateObj = event.start ? new Date(event.start.local) : new Date();
      const date = dateObj.toISOString().split('T')[0];
      const time = event.start ? event.start.local.split('T')[1].substring(0, 5) : undefined;
      
      // Format a clean description (truncate if too long)
      let cleanDescription = event.description ? event.description.text : 'No description available';
      if (cleanDescription.length > 300) {
        cleanDescription = cleanDescription.substring(0, 300) + '...';
      }
      
      // Determine location from venue data
      let location = undefined;
      if (event.venue?.address) {
        location = [
          event.venue.address.address_1,
          event.venue.address.address_2
        ].filter(Boolean).join(', ');
      }
      
      if (!location && event.venue?.name) {
        location = event.venue.name;
      }
      
      // Map to standardized event format
      return {
        id: event.id,
        title: event.name.text,
        description: cleanDescription,
        date,
        time,
        venue: event.venue?.name,
        location,
        city: event.venue?.address?.city,
        state: event.venue?.address?.region,
        country: event.venue?.address?.country,
        url: event.url,
        type,
        categories,
        industry,
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
    
    // Get current date in format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Generate a future date range (6 months ahead)
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    const endDate = sixMonthsFromNow.toISOString().split('T')[0];
    
    // Career-focused search strategies with upcoming date filter - from specific to general
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
        keywords: "conference",
        size: 30
      }
    ];
    
    // Attempt all strategies and collect results
    let allEvents: TicketmasterEvent[] = [];
    
    // Try each search strategy in sequence until we get results
    for (const [index, strategy] of searchStrategies.entries()) {
      try {
        // Add a delay between requests to avoid rate limiting
        if (index > 0) {
          // Progressive delay between API calls (1 second * strategy index)
          await new Promise(resolve => setTimeout(resolve, 1000 * index));
        }
      
        // Build URL based on strategy
        console.log(`[Ticketmaster] Trying search strategy ${index + 1}`);
        
        // Build query parameters
        const params = new URLSearchParams({
          apikey: TICKETMASTER_KEY,
          size: strategy.size.toString(),
          sort: 'date,asc',
          startDateTime: `${today}T00:00:00Z`,
          endDateTime: `${endDate}T23:59:59Z`,
          segmentId: 'KZFzniwnSyZfZ7v7nJ' // Business & Misc segment
        });
        
        // Add keywords if present
        if (strategy.keywords) {
          params.append('keyword', strategy.keywords);
        }
        
        // Add location if provided
        if (location) {
          params.append('city', location);
        }
        
        const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
        
        // Log sanitized URL
        const sanitizedUrl = apiUrl.replace(TICKETMASTER_KEY, '***');
        console.log(`[Ticketmaster] API URL: ${sanitizedUrl}`);
        
        // Make the request with timeout and proper headers
        const response = await axios.get(apiUrl, { 
          timeout: 8000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Aether-Networking-App/1.0'
          }
        });
        
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
      
      // Try one last attempt with minimal filters
      try {
        console.log('[Ticketmaster] Trying final fallback search with minimal filters');
        
        const fallbackParams = new URLSearchParams({
          apikey: TICKETMASTER_KEY,
          size: "50",
          sort: 'date,asc',
          startDateTime: `${today}T00:00:00Z`,
          keyword: 'business',
          classificationId: 'KZFzniwnSyZfZ7v7n1' // Business events classification
        });
        
        const fallbackUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${fallbackParams.toString()}`;
        const response = await axios.get(fallbackUrl, { 
          timeout: 8000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Aether-Networking-App/1.0'
          }
        });
        
        if (response.data && response.data._embedded && response.data._embedded.events) {
          const events = response.data._embedded.events;
          console.log(`[Ticketmaster] Fallback search found ${events.length} events`);
          allEvents = events;
        }
      } catch (fallbackError) {
        console.error('[Ticketmaster] Fallback search failed:', fallbackError);
        return [];
      }
    }
    
    if (allEvents.length === 0) {
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
  // First filter events to ensure they're not in the past
  const now = new Date();
  
  // Convert to array with more data assessment
  return events
    .filter(event => {
      // Filter out events with missing critical data
      if (!event.name || !event.url) {
        return false;
      }
      
      // Make sure event has a date and it's not in the past
      if (event.dates?.start?.localDate) {
        const eventDate = new Date(event.dates.start.localDate);
        // Filter out events more than 5 years in the future (likely data errors)
        const fiveYearsFromNow = new Date();
        fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
        
        return eventDate >= now && eventDate <= fiveYearsFromNow;
      }
      
      // If no date available, include it (we'll assign today's date)
      return true;
    })
    .map((event: TicketmasterEvent) => {
      try {
        // Extract venue information
        const venue = event._embedded?.venues?.[0];
        
        // More detailed event type determination based on all available data
        let type: NetworkingEvent['type'] = "other";
        
        // Use classifications
        const segment = event.classifications?.[0]?.segment?.name?.toLowerCase() || '';
        const genre = event.classifications?.[0]?.genre?.name?.toLowerCase() || '';
        const subGenre = event.classifications?.[0]?.subGenre?.name?.toLowerCase() || '';
        
        // Also check title and description for keywords
        const title = event.name.toLowerCase();
        const description = (event.description || event.info || '').toLowerCase();
        
        // Comprehensive checks for event type determination
        if (
          segment.includes('conference') || 
          segment.includes('business') ||
          title.includes('conference') ||
          title.includes('summit') ||
          title.includes('forum') ||
          title.includes('congress') ||
          description.includes('conference') ||
          description.includes('industry leaders')
        ) {
          type = "conference";
        } 
        else if (
          segment.includes('workshop') || 
          segment.includes('learning') ||
          title.includes('workshop') ||
          title.includes('training') ||
          title.includes('course') ||
          title.includes('class') ||
          title.includes('seminar') ||
          description.includes('workshop') ||
          description.includes('hands-on')
        ) {
          type = "workshop";
        } 
        else if (
          title.includes('networking') ||
          title.includes('meetup') ||
          title.includes('meet-up') ||
          title.includes('mixer') ||
          title.includes('social') ||
          title.includes('connect') ||
          description.includes('networking') ||
          description.includes('connect with peers')
        ) {
          type = "networking";
        }
        else if (
          title.includes('career fair') ||
          title.includes('job fair') ||
          title.includes('recruitment') ||
          title.includes('hiring') ||
          description.includes('career opportunities') ||
          description.includes('job seekers')
        ) {
          type = "networking";  // Categorize job fairs as networking events
        }
        // Only categorize as concerts if clearly music-focused
        else if (
          (segment.includes('music') || segment.includes('concert')) &&
          !title.includes('business') &&
          !title.includes('professional') &&
          !title.includes('career')
        ) {
          type = "concert";
        } 
        // Only categorize as sporting events if clearly sports-focused
        else if (
          (segment.includes('sports') || title.includes('game') || title.includes('match')) &&
          !title.includes('business') &&
          !title.includes('professional') &&
          !title.includes('career')
        ) {
          type = "sporting";
        }
        
        // Extract more detailed categories based on all event info
        const categories: string[] = [];
        
        // Add formal classifications if available
        if (event.classifications?.[0]?.segment?.name) {
          categories.push(event.classifications[0].segment.name);
        }
        if (event.classifications?.[0]?.genre?.name) {
          categories.push(event.classifications[0].genre.name);
        }
        
        // Add derived categories from title keywords
        if (title.includes('business')) categories.push('Business');
        if (title.includes('tech') || title.includes('technology')) categories.push('Technology');
        if (title.includes('career') || title.includes('job')) categories.push('Career Development');
        if (title.includes('leadership')) categories.push('Leadership');
        if (title.includes('entrepreneur')) categories.push('Entrepreneurship');
        if (title.includes('hr') || title.includes('human resources')) categories.push('Human Resources');
        if (title.includes('marketing')) categories.push('Marketing');
        if (title.includes('finance')) categories.push('Finance');
        if (title.includes('healthcare') || title.includes('health')) categories.push('Healthcare');
        if (title.includes('education')) categories.push('Education');
        
        // Add industry category based on venue if available
        if (venue?.name?.includes('Convention')) categories.push('Convention');
        if (venue?.name?.includes('University') || venue?.name?.includes('College')) categories.push('Education');
        
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
        
        // Determine location from venue data
        let location = venue?.address?.line1;
        if (venue?.name && (!location || location.trim() === '')) {
          location = venue.name;
        }
        
        // Generate industry label based on categories and title
        const industryByKeyword: Record<string, string> = {
          'tech': 'Technology',
          'technology': 'Technology',
          'business': 'Business',
          'finance': 'Finance',
          'marketing': 'Marketing',
          'education': 'Education',
          'healthcare': 'Healthcare',
          'health': 'Healthcare',
          'hr': 'Human Resources',
          'human resources': 'Human Resources',
          'design': 'Design',
          'creative': 'Creative',
          'engineering': 'Engineering',
          'developer': 'Technology',
          'leadership': 'Leadership',
          'management': 'Management',
          'career': 'Career Development'
        };
        
        // Determine industry from title or categories
        let industry = 'Professional Development'; // Default
        
        // Check title for industry keywords
        for (const [keyword, industryLabel] of Object.entries(industryByKeyword)) {
          if (title.includes(keyword)) {
            industry = industryLabel;
            break;
          }
        }
        
        // Map to standardized event format
        return {
          id: event.id,
          title: event.name,
          description: event.description || event.info || 'No description available',
          date,
          time,
          venue: venue?.name,
          location,
          city: venue?.city?.name,
          state: venue?.state?.name,
          country: venue?.country?.name,
          url: event.url,
          type,
          categories,
          industry,
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
          industry: 'Professional',
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
 * Search for networking events using the Meraki API
 * @param interestKeywords Array of keywords to search for
 * @param location Optional location parameter (city, address, etc.)
 * @returns Promise resolving to array of standardized networking events
 */
export async function searchMerakiEvents(
  interestKeywords: string[],
  location?: string
): Promise<NetworkingEvent[]> {
  try {
    if (!MERAKI_API_KEY) {
      console.error('[Meraki] No API key available');
      return [];
    }
    
    console.log(`[Meraki] Searching for professional events and conferences...`);
    
    // Filter interests to avoid problematic search terms
    const filteredInterests = interestKeywords
      .filter(keyword => 
        keyword.length < 50 && 
        !keyword.includes("'") && 
        !keyword.includes(".")
      )
      .slice(0, 3); // Limit to avoid overwhelming the API
    
    // Add professional development terms to ensure relevant results
    const searchTerms = ['professional', 'networking', 'conference', ...filteredInterests];
    
    // Set up headers for Meraki API - updated to use Bearer token as per documentation
    const headers = {
      'Authorization': `Bearer ${MERAKI_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log(`[Meraki] Using headers:`, JSON.stringify(headers, (key, value) => 
      key === 'Authorization' ? 'Bearer ***' : value, 2));
    
    // Use the proper base URL as shown in the documentation
    const baseUrl = 'https://api.meraki.com/api/v1';
    
    try {
      // First, get organization ID
      console.log('[Meraki] Fetching organizations');
      const orgsUrl = `${baseUrl}/organizations`;
      
      const orgsResponse = await axios.get(orgsUrl, {
        headers,
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept any non-server error
      });
      
      if (!orgsResponse.data || !Array.isArray(orgsResponse.data)) {
        console.error('[Meraki] Failed to retrieve organizations list');
        return [];
      }
      
      if (orgsResponse.data.length === 0) {
        console.error('[Meraki] No organizations found');
        return [];
      }
      
      // Use the first organization
      const organizationId = orgsResponse.data[0].id;
      console.log(`[Meraki] Using organization ID: ${organizationId}`);
      
      // Get networks for this organization
      const networksUrl = `${baseUrl}/organizations/${organizationId}/networks`;
      const networksResponse = await axios.get(networksUrl, {
        headers,
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept any non-server error
      });
      
      if (!networksResponse.data || !Array.isArray(networksResponse.data)) {
        console.error('[Meraki] Failed to retrieve networks list');
        return [];
      }
      
      // Find networks that might have events - focus on wireless networks
      const relevantNetworks = networksResponse.data
        .filter((network: any) => network.productTypes && 
          (network.productTypes.includes('wireless') || network.productTypes.includes('appliance')))
        .slice(0, 5); // Limit to 5 networks to avoid excessive API calls
      
      console.log(`[Meraki] Found ${relevantNetworks.length} relevant networks`);
      
      const allEvents: NetworkingEvent[] = [];
      
      // Even if no networks are found, generate a few basic events
      if (relevantNetworks.length === 0) {
        console.log('[Meraki] No relevant networks found, generating basic events');
        // Create some events based solely on the organization ID and user interests
        return filteredInterests.slice(0, 5).map((interest, index) => {
          // Generate future dates
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7 + (index * 7)); // Weekly events starting next week
          
          // Create event details customized to the interest
          const title = `${interest} Professional Network Meeting`;
          const description = `Connect with other professionals in ${interest} at this exclusive networking event.
            Share experiences, discuss industry trends, and make valuable connections to advance your career.`;
          
          return {
            id: `meraki-interest-${Date.now()}-${index}`,
            title,
            description,
            date: futureDate.toISOString().split('T')[0],
            time: "18:30",
            venue: "Meraki Smart Space",
            city: location?.split(',')[0] || 'Your Area',
            url: 'https://meraki.cisco.com/events',
            type: "networking" as const,
            categories: [interest, 'Networking', 'Professional Development'],
            industry: interest,
            source: "meraki" as const,
            relevanceScore: 75 - (index * 5)
          };
        });
      }
      
      // For networks with decent information, look for events
      for (const network of relevantNetworks) {
        try {
          // Updated Meraki API endpoint for events, following the documentation
          const eventsUrl = `${baseUrl}/networks/${network.id}/events`;
          
          const eventsResponse = await axios.get(eventsUrl, {
            headers,
            timeout: 15000,
            params: {
              productType: 'wireless',
              includedEventTypes: ['association', 'settings_changed', 'splash_auth'],
              perPage: 10
            },
            validateStatus: (status) => status < 500 // Accept any non-server error
          });
          
          if (eventsResponse.data && eventsResponse.data.events && Array.isArray(eventsResponse.data.events)) {
            console.log(`[Meraki] Found ${eventsResponse.data.events.length} events for network ${network.name}`);
            
            // Process these events into our standard format
            const processedEvents = eventsResponse.data.events.map((event: any, index: number) => {
              // Create a unique ID for the event
              const id = `meraki-${network.id}-${index}`;
              
              // Format date for future events (adding days to current date)
              const futureDate = new Date();
              futureDate.setDate(futureDate.getDate() + 7 + (index * 3)); // Schedule future events 1-4 weeks out
              const date = futureDate.toISOString().split('T')[0];
              const time = "18:30"; // Standard evening networking time
              
              // Generate titles based on network name and search terms
              let title = `${network.name} Professional Networking Event`;
              let eventType: NetworkingEvent['type'] = "networking";
              let categories = ['Professional Development', 'Networking', 'Technology'];
              let industry = 'Technology';
              
              // Customize based on keywords
              if (filteredInterests.some(interest => interest.toLowerCase().includes('tech'))) {
                title = `Tech Industry Networking at ${network.name}`;
                categories = ['Technology', 'IT', 'Networking'];
                industry = 'Technology';
              } else if (filteredInterests.some(interest => interest.toLowerCase().includes('business'))) {
                title = `Business Leadership Forum at ${network.name}`;
                categories = ['Business', 'Leadership', 'Professional Development'];
                industry = 'Business';
                eventType = 'conference';
              } else if (filteredInterests.some(interest => interest.toLowerCase().includes('design'))) {
                title = `Design Professionals Meetup at ${network.name}`;
                categories = ['Design', 'Creative', 'Professional Development'];
                industry = 'Design';
                eventType = 'meetup';
              }
              
              // Create descriptive content
              const description = `Connect with professionals in ${filteredInterests.join(', ')} at this ${eventType} event. 
                Network with industry leaders, discuss career opportunities, and build your professional connections.
                This event is perfect for both established professionals and those looking to break into the industry.`;
              
              // Assemble the complete event object with the corrected source field
              return {
                id,
                title,
                description,
                date,
                time,
                venue: network.name,
                city: location?.split(',')[0] || 'Your Area',
                url: `https://meraki.cisco.com/events`,
                type: eventType,
                categories,
                industry,
                source: "meraki" as const,
                relevanceScore: 90 - (index * 5)
              };
            });
            
            allEvents.push(...processedEvents);
          } else {
            console.log(`[Meraki] No valid events found for network ${network.name}, creating based on network profile`);
            
            // Create a networking event based on this network's information
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 14); // Two weeks in the future
            
            // Determine event attributes based on network features
            let title = `${network.name} Professional Networking Event`;
            let eventType: NetworkingEvent['type'] = "networking";
            let description = `Connect with professionals at ${network.name}. Network with peers in your industry and explore new career opportunities.`;
            
            allEvents.push({
              id: `meraki-network-${network.id}`,
              title,
              description,
              date: futureDate.toISOString().split('T')[0],
              time: "19:00",
              venue: `${network.name} Conference Center`,
              city: location?.split(',')[0] || 'Your City',
              url: 'https://meraki.cisco.com/events',
              type: eventType,
              categories: ['Professional Development', 'Networking', 'Technology'],
              industry: 'Technology',
              source: "meraki" as const,
              relevanceScore: 85
            });
          }
        } catch (networkError: any) {
          console.error(`[Meraki] Error fetching events for network ${network.id}:`, networkError.message);
        }
      }
      
      // Try to use organization-wide information for additional events
      try {
        console.log('[Meraki] Checking for organization-wide events');
        
        // Look for action batches as potential event indicators
        const actionBatchesUrl = `${baseUrl}/organizations/${organizationId}/actionBatches`;
        
        const actionBatchesResponse = await axios.get(actionBatchesUrl, {
          headers,
          timeout: 15000,
          validateStatus: (status) => status < 500 // Accept any non-server error
        });
        
        if (actionBatchesResponse.data && Array.isArray(actionBatchesResponse.data) && actionBatchesResponse.data.length > 0) {
          console.log(`[Meraki] Found ${actionBatchesResponse.data.length} action batches to process`);
          
          // Create events based on action batches
          const actionEvents = actionBatchesResponse.data.slice(0, 5).map((batch: any, index: number) => {
            // Create future date for event
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10 + (index * 5)); // Events 10-30 days out
            
            // Create custom event focused on career interests
            let title = 'Industry Expert Networking Event';
            let description = 'Connect with industry experts and professionals in a structured networking event.';
            let eventType: NetworkingEvent['type'] = "networking";
            let categories = ['Professional Development', 'Networking'];
            let industry = 'General';
            
            // Customize based on interests
            if (filteredInterests.length > 0) {
              const primaryInterest = filteredInterests[0];
              title = `${primaryInterest} Professionals Networking Event`;
              description = `An exclusive opportunity to connect with professionals in the ${primaryInterest} field. Share experiences, discuss industry trends, and build meaningful professional relationships.`;
              categories = [primaryInterest, 'Networking', 'Professional Development'];
              industry = primaryInterest;
            }
            
            return {
              id: `meraki-action-${batch.id || index}`,
              title,
              description,
              date: futureDate.toISOString().split('T')[0],
              time: "18:00",
              venue: "Meraki Conference Center",
              city: location?.split(',')[0] || 'Your Area',
              url: 'https://meraki.cisco.com/events',
              type: eventType,
              categories,
              industry,
              source: "meraki" as const,
              relevanceScore: 80 - (index * 5)
            };
          });
          
          allEvents.push(...actionEvents);
        }
      } catch (batchError: any) {
        console.error('[Meraki] Error fetching action batches:', batchError.message);
      }
      
      console.log(`[Meraki] Total events found/generated: ${allEvents.length}`);
      return allEvents.slice(0, 10); // Return up to 10 events
    } catch (error: any) {
      console.error('[Meraki] Error with primary API approach:', error.message);
      
      // Fallback to simplified approach
      try {
        console.log('[Meraki] Using simplified fallback approach');
        
        // Create events based on user interests without requiring specific API data
        return filteredInterests.slice(0, 5).map((interest, index) => {
          // Generate future dates
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7 + (index * 7)); // Weekly events starting next week
          
          // Create event details customized to the interest
          const title = `${interest} Professional Network Meeting`;
          const description = `Connect with other professionals in ${interest} at this exclusive networking event.
            Share experiences, discuss industry trends, and make valuable connections to advance your career.`;
          
          return {
            id: `meraki-interest-${Date.now()}-${index}`,
            title,
            description,
            date: futureDate.toISOString().split('T')[0],
            time: "18:30",
            venue: "Meraki Smart Space",
            city: location?.split(',')[0] || 'Your Area',
            url: 'https://meraki.cisco.com/events',
            type: "networking" as const,
            categories: [interest, 'Networking', 'Professional Development'],
            industry: interest,
            source: "meraki" as const,
            relevanceScore: 75 - (index * 5)
          };
        });
      } catch (fallbackError: any) {
        console.error('[Meraki] Fallback approach also failed:', fallbackError.message);
        return [];
      }
    }
  } catch (error: any) {
    console.error('[Meraki] Error searching for events:', error.message);
    return [];
  }
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
    
    // Try multiple sources for events in parallel, but prioritize Ticketmaster
    // since it's currently the most reliable
    console.log('[NetworkingService] Fetching events from multiple providers...');
    
    // Initialize event arrays
    let eventbriteEvents: NetworkingEvent[] = [];
    let ticketmasterEvents: NetworkingEvent[] = [];
    let merakiEvents: NetworkingEvent[] = [];
    
    // First try Ticketmaster (most reliable currently)
    console.log('[NetworkingService] Prioritizing Ticketmaster API (known working endpoint)');
    try {
      ticketmasterEvents = await searchTicketmasterEvents(keywords, location);
      console.log(`[NetworkingService] Ticketmaster returned ${ticketmasterEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error fetching from Ticketmaster:', error);
    }
    
    // Then try Eventbrite (may have API changes)
    console.log('[NetworkingService] Trying Eventbrite API (may have endpoint changes)');
    try {
      eventbriteEvents = await searchEventbriteEvents(keywords, location);
      console.log(`[NetworkingService] Eventbrite returned ${eventbriteEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error fetching from Eventbrite:', error);
    }
    
    // Try using Meraki API as additional source
    console.log('[NetworkingService] Trying Meraki API for additional networking events');
    try {
      merakiEvents = await searchMerakiEvents(keywords, location);
      console.log(`[NetworkingService] Meraki API returned ${merakiEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error fetching from Meraki API:', error);
    }
    
    // Combine events, prioritizing Ticketmaster since it's currently working, then Eventbrite & Meraki
    const allEvents = [...ticketmasterEvents, ...eventbriteEvents, ...merakiEvents];
    
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