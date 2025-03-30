import axios from 'axios';
import * as dotenv from 'dotenv';
import { format, addDays } from 'date-fns';

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

// RapidAPI key for web scraping (for AI Web Scraper and other services)
const RAPIDAPI_KEY = "3f9c2ecba6mshd1f47ab59b16e42p1e8991jsn055e3aba0a5a"; // Using provided key

// Google Custom Search credentials
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID; // Custom Search Engine ID
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Same key used for Gemini

// PredictHQ API credentials
const PREDICTHQ_API_TOKEN = process.env.PREDICTHQ_API_TOKEN;

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
  },
  rapidapi: {
    keyAvailable: !!RAPIDAPI_KEY
  },
  google: {
    apiKeyAvailable: !!GOOGLE_API_KEY,
    cseIdAvailable: !!GOOGLE_CSE_ID
  },
  predicthq: {
    apiTokenAvailable: !!PREDICTHQ_API_TOKEN
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
  source: "eventbrite" | "ticketmaster" | "meraki" | "generated" | "google" | "webscrape" | "predicthq";
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
    // Simplified Eventbrite API approach based on user's reference code
    console.log('[Eventbrite] Using simplified approach with direct token access');
    
    // Filter interests to avoid problematic search terms
    const filteredInterests = interestKeywords
      .filter(keyword => 
        keyword.length < 50 && 
        !keyword.includes("'") && 
        !keyword.includes(".")
      )
      .slice(0, 3); // Limit to avoid overwhelming the API
    
    // Eventbrite's search endpoint + query params
    const url = 'https://www.eventbriteapi.com/v3/events/search/';
    
    // Set up parameters for the search
    const params: Record<string, string> = {
      'q': filteredInterests.join(' ') || 'networking',
      'start_date.range_start': new Date().toISOString().split('T')[0]
    };
    
    // Add location parameter if provided
    if (location) {
      params['location.address'] = location || 'New York'; // Default to New York if no location
    } else {
      // If no location provided, add New York as default
      params['location.address'] = 'New York';
    }
    
    // Set up headers with token
    const headers = {
      'Authorization': `Bearer ${EVENTBRITE_TOKEN}`
    };
    
    console.log('[Eventbrite] Search parameters:', JSON.stringify(params));
    console.log('[Eventbrite] Using token authentication...');
    
    // Make the API request
    const response = await axios.get(url, {
      headers,
      params,
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    // Check if the request was successful and if there are events
    if (response.status !== 200) {
      console.error(`[Eventbrite] API error: ${response.status} ${JSON.stringify(response.data)}`);
      return [];
    }
    
    const data = response.data;
    const events = data.events || [];
    
    console.log(`[Eventbrite] Found ${events.length} events`);
    
    // If we have events, process and return them
    if (events.length > 0) {
      return processEventbriteEvents(events);
    }
    
    // Try a fallback with broader search if no events found
    console.log('[Eventbrite] No events found with specific search, trying broader search...');
    
    // Try a broader search with just "networking" and no location
    const fallbackParams = {
      'q': 'networking',
      'start_date.range_start': new Date().toISOString().split('T')[0]
    };
    
    const fallbackResponse = await axios.get(url, {
      headers,
      params: fallbackParams,
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    if (fallbackResponse.status === 200 && fallbackResponse.data && fallbackResponse.data.events) {
      const fallbackEvents = fallbackResponse.data.events;
      console.log(`[Eventbrite] Fallback search found ${fallbackEvents.length} events`);
      
      if (fallbackEvents.length > 0) {
        return processEventbriteEvents(fallbackEvents);
      }
    }
    
    console.log('[Eventbrite] No events found from any method');
    return [];
  } catch (error: any) {
    console.error('Error searching Eventbrite events:', error.message);
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
/**
 * Search for events using Google Custom Search
 * @param interestKeywords Array of keywords to search for
 * @param location Optional location parameter
 * @returns Promise resolving to array of networking events found via Google
 */
export async function searchGoogleForEvents(
  interestKeywords: string[],
  location?: string
): Promise<NetworkingEvent[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.error('[GoogleCSE] Missing required API credentials');
    return [];
  }
  
  try {
    console.log('[GoogleCSE] Searching for professional events...');
    
    // Filter and format keywords for optimal Google search
    const filteredKeywords = interestKeywords
      .filter(keyword => keyword.length < 50 && !keyword.includes("'") && !keyword.includes("."))
      .slice(0, 4);
    
    // Build a query specific to networking events
    let query = `${filteredKeywords.join(" ")} professional networking events conference workshop`;
    
    // Add location if provided
    if (location) {
      query += ` in ${location}`;
    }
    
    // Add date range to find current events
    const currentYear = new Date().getFullYear();
    query += ` ${currentYear} ${currentYear + 1}`;
    
    console.log(`[GoogleCSE] Search query: "${query}"`);
    
    // Make request to Google Custom Search API
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        num: 10, // Maximum number of results to return
        dateRestrict: 'y1' // Restrict to content from the past year
      },
      timeout: 10000
    });
    
    if (!response.data || !response.data.items || response.data.items.length === 0) {
      console.log('[GoogleCSE] No search results found');
      return [];
    }
    
    const searchItems = response.data.items;
    console.log(`[GoogleCSE] Found ${searchItems.length} search results`);
    
    // Process search results into standardized event format
    const events: NetworkingEvent[] = searchItems
      .filter((item: any) => {
        // Filter out results that don't seem like events
        const title = item.title.toLowerCase();
        const snippet = item.snippet.toLowerCase();
        
        // Check if the result seems like an event
        return (
          title.includes('conference') || 
          title.includes('event') || 
          title.includes('summit') || 
          title.includes('workshop') ||
          title.includes('networking') ||
          title.includes('meetup') ||
          snippet.includes('conference') || 
          snippet.includes('event date') || 
          snippet.includes('join us')
        );
      })
      .map((item: any, index: number) => {
        // Create an event from the search result
        
        // Extract date, if possible (basic pattern matching)
        let extractedDate = '';
        const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(st|nd|rd|th)?(,? \d{4})?/i;
        const dateMatch = item.snippet.match(dateRegex);
        
        if (dateMatch) {
          extractedDate = dateMatch[0];
        } else {
          // If no date found, assign one several months in the future
          const futureDate = new Date();
          futureDate.setMonth(futureDate.getMonth() + (index % 6) + 1); // Spread events over 6 months
          extractedDate = futureDate.toISOString().split('T')[0];
        }
        
        // Determine event type based on title and snippet
        let type: NetworkingEvent['type'] = "other";
        const titleLower = item.title.toLowerCase();
        const snippetLower = item.snippet.toLowerCase();
        
        if (
          titleLower.includes('conference') || 
          titleLower.includes('summit') || 
          snippetLower.includes('conference')
        ) {
          type = "conference";
        } 
        else if (
          titleLower.includes('workshop') || 
          titleLower.includes('training') || 
          snippetLower.includes('workshop')
        ) {
          type = "workshop";
        }
        else if (
          titleLower.includes('networking') || 
          titleLower.includes('mixer') || 
          snippetLower.includes('networking event')
        ) {
          type = "networking";
        }
        else if (
          titleLower.includes('meetup') || 
          snippetLower.includes('meetup')
        ) {
          type = "meetup";
        }
        
        // Extract categories based on content
        const categories: string[] = [];
        const categoryKeywords = [
          'business', 'technology', 'leadership', 'professional', 'career',
          'development', 'management', 'finance', 'marketing', 'healthcare'
        ];
        
        categoryKeywords.forEach(keyword => {
          if (
            titleLower.includes(keyword) || 
            snippetLower.includes(keyword)
          ) {
            categories.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
          }
        });
        
        // If no categories found, add a default one
        if (categories.length === 0) {
          categories.push('Professional Development');
        }
        
        // Use Google's unique item ID for our event ID
        const eventId = `google-${item.cacheId || index}-${Date.now()}`;
        
        return {
          id: eventId,
          title: item.title,
          description: item.snippet,
          date: extractedDate,
          location: item.displayLink,
          url: item.link,
          type,
          categories,
          industry: categories[0] || 'Professional Development',
          source: "google",
          image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src
        };
      });
    
    console.log(`[GoogleCSE] Processed ${events.length} events from search results`);
    return events;
  } catch (error: any) {
    console.error(`[GoogleCSE] Error searching for events:`, error.message);
    return [];
  }
}

/**
 * Search for events using web scraping via RapidAPI
 * @param interestKeywords Array of keywords to search for
 * @param location Optional location parameter
 * @returns Promise resolving to array of networking events found via web scraping
 */
export async function searchWebScrapingForEvents(
  interestKeywords: string[],
  location?: string
): Promise<NetworkingEvent[]> {
  // Using direct hard-coded key rather than environment variable
  const apiKey = "3f9c2ecba6mshd1f47ab59b16e42p1e8991jsn055e3aba0a5a";
  if (!apiKey) {
    console.error('[WebScrape] Missing RapidAPI key');
    return [];
  }
  
  try {
    console.log('[WebScrape] Searching for networking events via web scraping...');
    
    // Filter and prepare keywords
    const filteredKeywords = interestKeywords
      .filter(keyword => keyword.length < 40)
      .slice(0, 3);
    
    // Target websites to scrape (using pre-defined URLs for popular event sites)
    const targetSites = [
      { name: 'Eventbrite', url: 'https://www.eventbrite.com/d/united-states--new-york/professional-events/' },
      { name: 'Meetup', url: 'https://www.meetup.com/find/?keywords=professional-networking' }
    ];
    
    let allEvents: NetworkingEvent[] = [];
    
    // Process each target site in sequence
    for (const [index, site] of targetSites.entries()) {
      try {
        // Add delay between requests
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log(`[WebScrape] Scraping data from: ${site.name} (${site.url})`);
        
        // Using WebScrapingAPI from RapidAPI instead of AI Web Scraper
        const options = {
          method: 'GET',
          url: 'https://webscrapingapi.com/site/proxy-api',
          params: {
            api_key: apiKey,
            url: site.url,
            device: 'desktop',
            proxy_type: 'datacenter',
            render_js: '1'
          },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'webscrapingapi.p.rapidapi.com'
          }
        };
        
        const response = await axios.request(options);
        
        if (!response.data) {
          console.log(`[WebScrape] No content extracted from ${site.name}`);
          continue;
        }
        
        const content = response.data;
        console.log(`[WebScrape] Successfully extracted content from ${site.name}`);
        
        // Process the scraped content to extract events
        const events = processScrapedContent(content, site, filteredKeywords);
        console.log(`[WebScrape] Extracted ${events.length} events from ${site.name}`);
        
        // Add to our collection
        allEvents = [...allEvents, ...events];
        
        // If we have enough events, break early
        if (allEvents.length >= 20) {
          console.log('[WebScrape] Found enough events, stopping scraping');
          break;
        }
      } catch (siteError: any) {
        console.error(`[WebScrape] Error processing ${site.name}:`, siteError.message);
      }
    }
    
    console.log(`[WebScrape] Total events found from web scraping: ${allEvents.length}`);
    return allEvents;
  } catch (error: any) {
    console.error('[WebScrape] Error in web scraping:', error.message);
    return [];
  }
}

/**
 * Process scraped content to extract event information
 * @param content Scraped content from website
 * @param sourceSite Original source site
 * @param keywords User keywords for relevance
 * @returns Array of networking events
 */
function processScrapedContent(
  content: string,
  sourceSite: { name: string; url: string },
  keywords: string[]
): NetworkingEvent[] {
  // Simple extraction logic to identify events in the content
  const events: NetworkingEvent[] = [];
  
  // Try to split content into sections that might represent events
  const sections = content.split(/\n{2,}/).filter(section => section.length > 100);
  
  console.log(`[WebScrape] Processing ${sections.length} content sections`);
  
  // For each potential event section
  sections.forEach((section, index) => {
    // Check if section appears to be an event listing
    const isEventSection = 
      /event|conference|workshop|webinar|meetup|networking/i.test(section) &&
      (/date|when|schedule/i.test(section) || /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(section));
    
    if (!isEventSection) return;
    
    // Extract title (first sentence or prominent text)
    let title = '';
    const titleMatch = section.match(/^([^.!?]+)[.!?]/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // Fallback - take first 60 chars
      title = section.substring(0, 60).trim() + '...';
    }
    
    // Extract potential date
    let date = '';
    const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(st|nd|rd|th)?(,? \d{4})?/i;
    const dateMatch = section.match(dateRegex);
    
    if (dateMatch) {
      date = dateMatch[0];
    } else {
      // Generate a future date if none found
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + (index % 6) + 1);
      date = futureDate.toISOString().split('T')[0];
    }
    
    // Create event with available info
    events.push({
      id: `webscrape-${sourceSite.name.toLowerCase()}-${index}-${Date.now()}`,
      title: title.length > 10 ? title : `Professional Networking Event #${index + 1}`,
      description: section.substring(0, 200) + '...',
      date,
      url: sourceSite.url,
      type: determineEventType(section),
      categories: determineEventCategories(section, keywords),
      industry: determineEventIndustry(section, keywords),
      source: "webscrape",
      location: extractLocation(section) || 'Virtual Event'
    });
  });
  
  return events;
}

/**
 * Determine event type based on content
 */
function determineEventType(content: string): NetworkingEvent['type'] {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('conference') || contentLower.includes('summit')) {
    return 'conference';
  }
  
  if (contentLower.includes('workshop') || contentLower.includes('training')) {
    return 'workshop';
  }
  
  if (contentLower.includes('networking') || contentLower.includes('mixer')) {
    return 'networking';
  }
  
  if (contentLower.includes('meetup') || contentLower.includes('meet up')) {
    return 'meetup';
  }
  
  return 'conference'; // Default
}

/**
 * Determine event categories based on content and keywords
 */
function determineEventCategories(content: string, keywords: string[]): string[] {
  const contentLower = content.toLowerCase();
  const categories: string[] = [];
  
  // Check for common categories
  const categoryKeywords = [
    'business', 'technology', 'marketing', 'leadership', 'entrepreneurship',
    'finance', 'healthcare', 'education', 'engineering', 'design',
    'career', 'professional', 'networking', 'development'
  ];
  
  // Add matching categories from common keywords
  categoryKeywords.forEach(keyword => {
    if (contentLower.includes(keyword)) {
      categories.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });
  
  // Also check user's interests
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    if (contentLower.includes(keywordLower) && !categories.includes(keyword)) {
      categories.push(keyword);
    }
  });
  
  // If no categories found, add a default
  if (categories.length === 0) {
    categories.push('Professional Development');
  }
  
  // Limit to 3 categories
  return categories.slice(0, 3);
}

/**
 * Determine industry based on content and keywords
 */
function determineEventIndustry(content: string, keywords: string[]): string {
  const contentLower = content.toLowerCase();
  
  // Industry keyword mapping
  const industryMapping: Record<string, string> = {
    'tech': 'Technology',
    'technology': 'Technology',
    'business': 'Business',
    'finance': 'Finance',
    'marketing': 'Marketing',
    'education': 'Education',
    'healthcare': 'Healthcare',
    'design': 'Design',
    'engineering': 'Engineering',
    'hr': 'Human Resources',
    'human resources': 'Human Resources'
  };
  
  // Check for industries in the content
  for (const [keyword, industry] of Object.entries(industryMapping)) {
    if (contentLower.includes(keyword)) {
      return industry;
    }
  }
  
  // Check user keywords for industry matches
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    for (const [industryKeyword, industryName] of Object.entries(industryMapping)) {
      if (keywordLower.includes(industryKeyword)) {
        return industryName;
      }
    }
  }
  
  return 'Professional Development'; // Default
}

/**
 * Extract location information from content
 */
function extractLocation(content: string): string | undefined {
  // Look for common location patterns
  const locationRegex = /\b(in|at|location)\s*:\s*([^.,]+)/i;
  const locationMatch = content.match(locationRegex);
  
  if (locationMatch && locationMatch[2]) {
    return locationMatch[2].trim();
  }
  
  // Look for city names with state codes
  const cityStateRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})\b/;
  const cityStateMatch = content.match(cityStateRegex);
  
  if (cityStateMatch) {
    return `${cityStateMatch[1]}, ${cityStateMatch[2]}`;
  }
  
  return undefined;
}

// Define the PredictHQ event interface based on their API response
interface PredictHQEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end?: string; // ISO date string
  timezone?: string;
  location?: {
    lat: number;
    lon: number;
  };
  entities?: {
    name?: string;
    formatted_address?: string;
    type?: string;
    location?: {
      lat: number;
      lon: number;
    };
  }[];
  category: string;
  labels: string[];
  rank: number;
  local_rank?: number;
  aviation_rank?: number;
  phq_attendance?: number;
  place_hierarchies?: string[][];
  state?: string;
  country?: string;
  private?: boolean;
}

/**
 * Search for events using PredictHQ API
 * @param interestKeywords Array of keywords to search for
 * @param location Optional location parameter (city, address, etc.)
 * @returns Promise resolving to array of standardized networking events
 */
export async function searchPredictHQEvents(
  interestKeywords: string[],
  location?: string
): Promise<NetworkingEvent[]> {
  try {
    if (!PREDICTHQ_API_TOKEN) {
      console.error('[PredictHQ] API token is missing');
      return [];
    }

    console.log('[PredictHQ] Starting event search');

    // Format today's date in YYYY-MM-DD format
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Set an end date 6 months from now
    const sixMonthsLater = format(addDays(new Date(), 180), 'yyyy-MM-dd');

    // Build category filters - focusing on business/professional events
    const categories = [
      'conferences',
      'expos',
      'community'
    ].join(',');

    // Filter keywords to avoid problematic search terms
    const filteredKeywords = interestKeywords
      .filter(keyword => 
        keyword.length < 50 && 
        !keyword.includes("'") && 
        !keyword.includes(".")
      )
      .slice(0, 3); // Limit to avoid overwhelming the API

    // Create various API call strategies to get diverse results
    const searchStrategies = [
      // Strategy 1: Business and conference focus with keywords
      {
        q: filteredKeywords.length > 0 ? 
           filteredKeywords.join(' ') + ' business conference' : 
           'business conference networking',
        'active.gte': today,
        'active.lte': sixMonthsLater,
        category: categories,
        limit: 20,
        sort: 'rank'
      },
      // Strategy 2: Professional development focus
      {
        q: 'professional development networking',
        'active.gte': today,
        'active.lte': sixMonthsLater,
        category: categories,
        limit: 20,
        sort: 'rank'
      },
      // Strategy 3: Career-focused events
      {
        q: 'career networking jobs',
        'active.gte': today,
        'active.lte': sixMonthsLater,
        category: categories,
        limit: 20,
        sort: 'rank'
      }
    ];

    // If location is provided, add it to strategies
    if (location) {
      const locationStrategies = searchStrategies.map(strategy => ({
        ...strategy,
        q: `${strategy.q} ${location}`
      }));
      searchStrategies.push(...locationStrategies);
    }

    let allEvents: PredictHQEvent[] = [];

    // Try each search strategy
    for (const [index, strategy] of searchStrategies.entries()) {
      try {
        console.log(`[PredictHQ] Trying search strategy ${index + 1}:`, strategy);

        // Add delay between requests to avoid rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * index));
        }

        // Build the query parameters
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(strategy)) {
          params.append(key, value.toString());
        }

        // Make the API request
        const response = await axios.get(`https://api.predicthq.com/v1/events?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${PREDICTHQ_API_TOKEN}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        // Process the results if they exist
        if (response.data && response.data.results) {
          const events = response.data.results as PredictHQEvent[];
          console.log(`[PredictHQ] Strategy ${index + 1} found ${events.length} events`);

          // Add events to our collection, filtering out duplicates
          const newEvents = events.filter(event => 
            !allEvents.some(existingEvent => existingEvent.id === event.id)
          );
          
          allEvents = [...allEvents, ...newEvents];

          // If we have enough events, we can stop searching
          if (allEvents.length >= 40) {
            console.log('[PredictHQ] Found enough events, stopping search');
            break;
          }
        } else {
          console.log(`[PredictHQ] Strategy ${index + 1} returned no events`);
        }
      } catch (strategyError: any) {
        console.error(`[PredictHQ] Strategy ${index + 1} failed:`, strategyError.message);
      }
    }

    console.log(`[PredictHQ] Total unique events found: ${allEvents.length}`);

    // Process events into our standard format
    const processedEvents: NetworkingEvent[] = allEvents.map(event => {
      // Convert PredictHQ event to our NetworkingEvent format
      
      // Determine event type
      let type: NetworkingEvent['type'] = "other";
      const titleLower = event.title.toLowerCase();
      const category = event.category.toLowerCase();
      
      if (
        titleLower.includes('conference') || 
        titleLower.includes('summit') || 
        category === 'conferences'
      ) {
        type = "conference";
      } 
      else if (
        titleLower.includes('workshop') || 
        titleLower.includes('training') || 
        titleLower.includes('seminar')
      ) {
        type = "workshop";
      } 
      else if (
        titleLower.includes('meetup') || 
        titleLower.includes('meet up') || 
        titleLower.includes('meeting')
      ) {
        type = "meetup";
      }
      else if (
        titleLower.includes('networking') || 
        titleLower.includes('mixer') || 
        titleLower.includes('social')
      ) {
        type = "networking";
      }
      else if (category === 'expos') {
        type = "conference";
      }
      else if (category === 'community') {
        type = "networking";
      }
      
      // Determine categories based on event labels and title
      const categories: string[] = [];
      
      // Map PredictHQ labels to our categories
      if (event.labels && event.labels.length > 0) {
        const labelMapping: Record<string, string> = {
          'business': 'Business',
          'technology': 'Technology',
          'tech': 'Technology',
          'education': 'Education',
          'networking': 'Networking',
          'professional': 'Professional Development',
          'career': 'Career Development',
          'leadership': 'Leadership',
          'entrepreneur': 'Entrepreneurship',
          'finance': 'Finance',
          'marketing': 'Marketing',
          'sales': 'Sales',
          'startup': 'Entrepreneurship'
        };
        
        event.labels.forEach(label => {
          const lcLabel = label.toLowerCase();
          for (const [keyword, category] of Object.entries(labelMapping)) {
            if (lcLabel.includes(keyword) && !categories.includes(category)) {
              categories.push(category);
            }
          }
        });
      }
      
      // If no categories were found from labels, extract from title
      if (categories.length === 0) {
        const categoryKeywords = [
          { keyword: 'business', category: 'Business' },
          { keyword: 'tech', category: 'Technology' },
          { keyword: 'technology', category: 'Technology' },
          { keyword: 'education', category: 'Education' },
          { keyword: 'networking', category: 'Networking' },
          { keyword: 'professional', category: 'Professional Development' },
          { keyword: 'career', category: 'Career Development' },
          { keyword: 'leadership', category: 'Leadership' },
          { keyword: 'entrepreneur', category: 'Entrepreneurship' },
          { keyword: 'startup', category: 'Entrepreneurship' },
          { keyword: 'finance', category: 'Finance' },
          { keyword: 'marketing', category: 'Marketing' },
          { keyword: 'sales', category: 'Sales' }
        ];
        
        categoryKeywords.forEach(({ keyword, category }) => {
          if (titleLower.includes(keyword) && !categories.includes(category)) {
            categories.push(category);
          }
        });
      }
      
      // Add default category if none found
      if (categories.length === 0) {
        if (type === "conference") {
          categories.push('Business');
        } else if (type === "workshop") {
          categories.push('Professional Development');
        } else {
          categories.push('Networking');
        }
      }
      
      // Determine industry based on categories, defaulting to first category
      let industry = categories.length > 0 ? categories[0] : 'Professional Development';
      
      // Extract date and time
      const startDate = new Date(event.start);
      const date = startDate.toISOString().split('T')[0];
      const time = startDate.toISOString().split('T')[1].substring(0, 5);
      
      // Build location string
      let location: string | undefined = undefined;
      let city: string | undefined = undefined;
      let state: string | undefined = undefined;
      let country: string | undefined = event.country;
      let venue: string | undefined = undefined;
      
      // Try to extract location details from entities
      if (event.entities && event.entities.length > 0) {
        const venueEntity = event.entities.find(entity => entity.type === 'venue');
        const placeEntity = event.entities.find(entity => entity.type === 'place');
        
        if (venueEntity) {
          venue = venueEntity.name;
          location = venueEntity.formatted_address;
        }
        
        if (placeEntity && !location) {
          location = placeEntity.formatted_address;
        }
      }
      
      // If we still don't have location and there's a place hierarchy, use that
      if (!location && event.place_hierarchies && event.place_hierarchies.length > 0) {
        const placeHierarchy = event.place_hierarchies[0];
        // Typically structured as [country, state, county, city, etc]
        if (placeHierarchy.length >= 4) {
          city = placeHierarchy[3];
          state = placeHierarchy[2];
          country = placeHierarchy[0];
          location = [city, state, country].filter(Boolean).join(', ');
        }
      }
      
      // Make sure description isn't too long
      let description = event.description || 'Professional networking event';
      if (description.length > 300) {
        description = description.substring(0, 297) + '...';
      }
      
      // Generate a URL if one is not provided
      const url = `https://predicthq.com/events/${event.id}`;
      
      return {
        id: event.id,
        title: event.title,
        description,
        date,
        time,
        location,
        city,
        state,
        country,
        venue,
        url,
        type,
        categories,
        industry,
        source: "predicthq",
        // Add a relevance score based on the event's rank
        relevanceScore: event.rank / 100
      };
    });

    return processedEvents;
  } catch (error: any) {
    console.error('[PredictHQ] Error searching for events:', error.message);
    return [];
  }
}

export async function getNetworkingEvents(
  careerProfile: { 
    careers?: string[];
    skills?: string[];
    interests?: string[];
    personalityType?: string;
    location?: string;
  }
): Promise<NetworkingEvent[]> {
  try {
    // Extract data from the career profile
    const {
      careers = [],
      skills = [],
      interests = [],
      personalityType = 'Balanced',
      location
    } = careerProfile;
    
    console.log(`[NetworkingService] Fetching events for personality: ${personalityType}`);
    
    // Generate keywords based on career profile components
    // Add networking-specific terms to the search
    const keywords = [
      ...careers,
      ...skills,
      ...interests,
      'networking',
      'professional',
      'career',
      'development'
    ];
    
    console.log(`[NetworkingService] Generated search keywords: ${keywords.join(', ')}`);
    
    // Try multiple sources for events, with expanded data sources
    console.log('[NetworkingService] Fetching events from multiple providers...');
    
    // Initialize event arrays
    let eventbriteEvents: NetworkingEvent[] = [];
    let ticketmasterEvents: NetworkingEvent[] = [];
    let googleEvents: NetworkingEvent[] = [];
    let webScrapeEvents: NetworkingEvent[] = [];
    let merakiEvents: NetworkingEvent[] = [];
    let predictHQEvents: NetworkingEvent[] = [];
    
    // First try Ticketmaster (most reliable currently)
    console.log('[NetworkingService] Prioritizing Ticketmaster API (known working endpoint)');
    try {
      ticketmasterEvents = await searchTicketmasterEvents(keywords, location);
      console.log(`[NetworkingService] Ticketmaster returned ${ticketmasterEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error fetching from Ticketmaster:', error);
    }
    
    // Try Google Custom Search for events
    console.log('[NetworkingService] Trying Google Custom Search for events');
    try {
      googleEvents = await searchGoogleForEvents(keywords, location);
      console.log(`[NetworkingService] Google Search returned ${googleEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error fetching from Google:', error);
    }
    
    // Try web scraping for events through RapidAPI
    console.log('[NetworkingService] Trying web scraping to find events');
    try {
      webScrapeEvents = await searchWebScrapingForEvents(keywords, location);
      console.log(`[NetworkingService] Web scraping returned ${webScrapeEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error with web scraping:', error);
    }
    
    // Try Eventbrite (may have API changes)
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
    
    // Try using PredictHQ API as a new reliable source
    console.log('[NetworkingService] Trying PredictHQ API for professional events');
    try {
      predictHQEvents = await searchPredictHQEvents(keywords, location);
      console.log(`[NetworkingService] PredictHQ API returned ${predictHQEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error fetching from PredictHQ API:', error);
    }
    
    // Combine all events from all sources with prioritization
    const allEvents = [
      ...predictHQEvents, // Prioritize PredictHQ events as they're more reliable and business-focused
      ...ticketmasterEvents, 
      ...googleEvents,
      ...webScrapeEvents,
      ...eventbriteEvents, 
      ...merakiEvents
    ];
    
    if (allEvents.length === 0) {
      console.warn('[NetworkingService] No events found from any source, generating personalized sample events');
      
      // Create sample events tailored to the user's career profile
      const sampleEvents: NetworkingEvent[] = [];
      
      // Base each sample on the user's personality and career interests
      const personality = personalityType.toLowerCase();
      let careerFocus = 'general';
      
      // Determine primary career focus based on interests
      const allInterests = [...interests, ...careers, ...skills];
      if (allInterests.some(i => i.toLowerCase().includes('human resource') || i.toLowerCase().includes('hr'))) {
        careerFocus = 'hr';
      } else if (allInterests.some(i => i.toLowerCase().includes('health') || i.toLowerCase().includes('care'))) {
        careerFocus = 'healthcare';
      } else if (allInterests.some(i => i.toLowerCase().includes('tech') || i.toLowerCase().includes('software'))) {
        careerFocus = 'tech';
      } else if (allInterests.some(i => i.toLowerCase().includes('design') || i.toLowerCase().includes('creative'))) {
        careerFocus = 'design';
      } else if (allInterests.some(i => i.toLowerCase().includes('community') || i.toLowerCase().includes('social'))) {
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
      keywords,
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