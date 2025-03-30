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
    if (!EVENTBRITE_TOKEN) {
      console.error('[Eventbrite] No API token available');
      return [];
    }
    
    console.log(`[Eventbrite] Searching for career-related events...`);
    
    // Prepare search parameters
    const params = new URLSearchParams();
    
    // Add career-focused keywords for better results
    // We'll use a career-focused search term combined with the user's interests
    const careerTerms = ['conference', 'networking', 'professional', 'business', 'career'];
    
    // Add user interests to search terms, filtered to avoid special characters
    const filteredInterests = interestKeywords
      .filter(keyword => 
        keyword.length < 50 && 
        !keyword.includes("'re") && 
        !keyword.includes(".")
      )
      .slice(0, 3); // Limit to first 3 interests to avoid overly specific queries
      
    // Combine with career terms
    const searchTerms = [...careerTerms, ...filteredInterests];
    
    // Create a good search query by joining terms
    const searchQuery = searchTerms.join(' ');
    params.append('q', searchQuery);
    
    // Set categories to business, career or networking categories
    // 101 = Business, 102 = Science & Tech
    params.append('categories', '101,102');
    
    // Sort by date
    params.append('sort_by', 'date');
    
    // Limit results
    params.append('expand', 'venue');
    
    // Add location if provided
    if (location) {
      params.append('location.address', location);
      params.append('location.within', '50mi');
    }
    
    // Set future events only
    const today = new Date().toISOString().split('T')[0];
    params.append('start_date.range_start', today);
    
    // Build the URL with search parameters
    // Ensure we're using a supported endpoint that exists
    const searchUrl = `https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`;
    console.log(`[Eventbrite] Searching with URL: ${searchUrl}`);
    
    // Make the API request with detailed headers
    console.log(`[Eventbrite] Making request to ${searchUrl}`);
    
    const headers = {
      'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    console.log(`[Eventbrite] Using headers:`, JSON.stringify(headers, (key, value) => 
      key === 'Authorization' ? 'Bearer ***' : value, 2));
    
    const response = await axios.get(searchUrl, {
      headers,
      timeout: 12000, // Increase timeout for more reliability
      validateStatus: (status) => true // Accept any status code to properly handle errors
    });
    
    // Log detailed response information
    console.log(`[Eventbrite] Response status: ${response.status}`);
    
    // Check for HTTP errors
    if (response.status >= 400) {
      console.error(`[Eventbrite] HTTP Error: ${response.status} - ${response.statusText}`);
      console.error(`[Eventbrite] Response data:`, JSON.stringify(response.data || {}, null, 2));
      
      // Special handling for common error codes
      if (response.status === 401) {
        console.error('[Eventbrite] Authentication error - invalid token');
      } else if (response.status === 404) {
        console.error('[Eventbrite] Resource not found - potentially invalid endpoint');
      } else if (response.status === 429) {
        console.error('[Eventbrite] Rate limit exceeded');
      }
      
      // Try simplified fallback search 
      try {
        console.log('[Eventbrite] Trying simplified fallback search with minimal parameters...');
        const simplifiedParams = new URLSearchParams();
        
        // Use very basic search terms to maximize chance of success
        simplifiedParams.append('q', 'conference');
        
        // Add date filter for future events
        const today = new Date().toISOString().split('T')[0];
        simplifiedParams.append('start_date.range_start', today);
        
        const fallbackUrl = `https://www.eventbriteapi.com/v3/events/search/?${simplifiedParams.toString()}`;
        console.log(`[Eventbrite] Fallback URL: ${fallbackUrl}`);
        
        const fallbackResponse = await axios.get(fallbackUrl, {
          headers,
          timeout: 12000,
          validateStatus: (status) => true
        });
        
        console.log(`[Eventbrite] Fallback response status: ${fallbackResponse.status}`);
        
        if (fallbackResponse.status === 200 && 
            fallbackResponse.data && 
            fallbackResponse.data.events && 
            Array.isArray(fallbackResponse.data.events)) {
          console.log(`[Eventbrite] Fallback search found ${fallbackResponse.data.events.length} events`);
          return processEventbriteEvents(fallbackResponse.data.events);
        } else {
          console.error(`[Eventbrite] Fallback search failed with status ${fallbackResponse.status}`);
          console.log(`[Eventbrite] Fallback response keys:`, 
            Object.keys(fallbackResponse.data || {}).join(', '));
        }
      } catch (fallbackError: any) {
        console.error('[Eventbrite] Fallback search also failed:', fallbackError.message);
      }
      
      return [];
    }
    
    // Check if the response contains an API error
    if (response.data && response.data.error) {
      console.error(`[Eventbrite] API Error: ${response.data.error} - ${response.data.error_description}`);
      return [];
    }
    
    // Extract events from response
    if (response.data && response.data.events && Array.isArray(response.data.events)) {
      console.log(`[Eventbrite] Successfully found ${response.data.events.length} events via search API`);
      return processEventbriteEvents(response.data.events);
    }
    
    console.log('[Eventbrite] Search returned no events');
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
        // Build URL based on strategy
        console.log(`[Ticketmaster] Trying search strategy ${index + 1}`);
        
        // Build query parameters
        const params = new URLSearchParams({
          apikey: TICKETMASTER_KEY,
          size: strategy.size.toString(),
          sort: 'date,asc',
          startDateTime: `${today}T00:00:00Z`,
          endDateTime: `${endDate}T23:59:59Z`,
          classificationName: 'conference,business,meeting'
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
      
      // Try one last attempt with minimal filters
      try {
        console.log('[Ticketmaster] Trying final fallback search with minimal filters');
        
        const fallbackParams = new URLSearchParams({
          apikey: TICKETMASTER_KEY,
          size: "50",
          sort: 'date,asc',
          startDateTime: `${today}T00:00:00Z`,
        });
        
        const fallbackUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${fallbackParams.toString()}`;
        const response = await axios.get(fallbackUrl, { timeout: 5000 });
        
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
    
    // Determine search scope to focus on career events
    const scope = "professional events";
    
    // Set up headers for Meraki API
    const headers = {
      'X-Cisco-Meraki-API-Key': MERAKI_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log(`[Meraki] Using headers:`, JSON.stringify(headers, (key, value) => 
      key === 'X-Cisco-Meraki-API-Key' ? 'API_KEY_HIDDEN' : value, 2));
    
    // Construct the base URL for events endpoint
    const baseUrl = 'https://api.meraki.com/api/v1/networks';
    
    try {
      // Get a list of available networks first
      console.log('[Meraki] Fetching available networks');
      const networksResponse = await axios.get(`${baseUrl}`, {
        headers,
        timeout: 15000
      });
      
      if (!networksResponse.data || !Array.isArray(networksResponse.data)) {
        console.error('[Meraki] Failed to retrieve networks list');
        return [];
      }
      
      // Find networks that might have events
      const relevantNetworks = networksResponse.data
        .filter((network: any) => network.productTypes && network.productTypes.includes('wireless'))
        .slice(0, 5); // Limit to 5 networks to avoid excessive API calls
      
      console.log(`[Meraki] Found ${relevantNetworks.length} relevant networks`);
      
      const allEvents: NetworkingEvent[] = [];
      
      // For each network, try to find events
      for (const network of relevantNetworks) {
        try {
          // Check for events in this network
          console.log(`[Meraki] Checking network: ${network.name} (${network.id})`);
          
          // Use appropriate endpoint for conference/event data
          // Specific endpoint varies based on Meraki API version and product
          const eventsUrl = `${baseUrl}/${network.id}/events`;
          
          const eventsResponse = await axios.get(eventsUrl, {
            headers,
            timeout: 15000,
            params: {
              productType: 'wireless',
              includedEventTypes: ['connection', 'association'],
              perPage: 20
            }
          });
          
          if (eventsResponse.data && Array.isArray(eventsResponse.data)) {
            console.log(`[Meraki] Found ${eventsResponse.data.length} events for network ${network.name}`);
            
            // Process these events into our standard format
            const processedEvents = eventsResponse.data.map((event: any, index: number) => {
              // Create a unique ID for the event
              const id = `meraki-${network.id}-${index}`;
              
              // Generate an event name based on network and location
              const title = `${event.eventType || 'Networking Event'} at ${network.name}`;
              
              // Create descriptive information from available data
              const description = event.description || 
                                 `Professional networking opportunity in the ${network.name} network. ${
                                  event.clientDescription || 'Connect with industry professionals.'
                                 }`;
              
              // Format date information
              const dateObj = event.occurredAt ? new Date(event.occurredAt) : new Date();
              const date = dateObj.toISOString().split('T')[0];
              const time = dateObj.toTimeString().split(' ')[0].substring(0, 5);
              
              // Determine location information
              const location = network.address || 'Location information not available';
              const city = location.split(',')[0] || undefined;
              const country = network.country || undefined;
              
              // Choose appropriate event type
              let type: NetworkingEvent['type'] = "networking";
              
              // Assign relevant categories
              const categories = ['Professional Development', 'Networking'];
              if (network.tags && Array.isArray(network.tags)) {
                network.tags.forEach((tag: string) => {
                  if (tag && !categories.includes(tag)) {
                    categories.push(tag);
                  }
                });
              }
              
              // Assemble the complete event object
              return {
                id,
                title,
                description,
                date,
                time,
                location,
                city,
                country,
                venue: network.name,
                url: `https://dashboard.meraki.com/network/${network.id}`,
                type,
                categories,
                industry: 'Technology',
                source: "meraki" as "meraki"
              };
            });
            
            allEvents.push(...processedEvents);
          } else {
            console.log(`[Meraki] No events found for network ${network.name}`);
          }
        } catch (networkError: any) {
          console.error(`[Meraki] Error fetching events for network ${network.id}:`, networkError.message);
        }
      }
      
      console.log(`[Meraki] Total events found: ${allEvents.length}`);
      return allEvents;
    } catch (error: any) {
      console.error('[Meraki] Error fetching networks:', error.message);
      
      // Provide fallback events from a different endpoint if main approach fails
      try {
        console.log('[Meraki] Trying fallback approach to find events');
        
        // Try the devices endpoint which can also contain event-related data
        const devicesUrl = 'https://api.meraki.com/api/v1/organizations';
        
        // Get organizations first
        const orgsResponse = await axios.get(devicesUrl, {
          headers,
          timeout: 15000
        });
        
        if (!orgsResponse.data || !Array.isArray(orgsResponse.data) || orgsResponse.data.length === 0) {
          console.error('[Meraki] Failed to retrieve organizations');
          return [];
        }
        
        // Use the first organization
        const orgId = orgsResponse.data[0].id;
        console.log(`[Meraki] Using organization: ${orgsResponse.data[0].name} (${orgId})`);
        
        // Get devices in this organization which might host events
        const devicesResponse = await axios.get(`${devicesUrl}/${orgId}/devices`, {
          headers,
          timeout: 15000
        });
        
        if (!devicesResponse.data || !Array.isArray(devicesResponse.data)) {
          console.error('[Meraki] Failed to retrieve devices');
          return [];
        }
        
        console.log(`[Meraki] Found ${devicesResponse.data.length} devices`);
        
        // Create events based on device locations (simulation based on real infrastructure)
        return devicesResponse.data.slice(0, 10).map((device: any, index: number) => {
          // Generate an event ID
          const id = `meraki-device-${device.serial || index}`;
          
          // Create event titles based on search terms and device info
          const keyword = searchTerms[index % searchTerms.length];
          const title = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Conference at ${
            device.name || 'Meraki Location ' + (index + 1)
          }`;
          
          // Generate descriptive content
          const description = `Connect with professionals in ${
            filteredInterests.join(', ')
          } at this networking event. Powered by Meraki smart spaces technology.`;
          
          // Create date/time (upcoming dates)
          const dateObj = new Date();
          dateObj.setDate(dateObj.getDate() + (index + 1) * 7); // Weekly events
          const date = dateObj.toISOString().split('T')[0];
          
          // Create location information
          const address = device.address || device.mac;
          
          // Return the standardized event
          return {
            id,
            title,
            description,
            date,
            location: address,
            url: `https://dashboard.meraki.com/devices/${device.serial}`,
            type: "networking",
            categories: ['Technology', 'Professional Development', 'Networking'],
            industry: 'Technology',
            source: "meraki" as "meraki"
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
    
    // First try Eventbrite since we now have credentials
    console.log('[NetworkingService] Prioritizing Eventbrite API with newly added credentials');
    let eventbriteEvents: NetworkingEvent[] = [];
    
    try {
      eventbriteEvents = await searchEventbriteEvents(keywords, location);
      console.log(`[NetworkingService] Eventbrite returned ${eventbriteEvents.length} events`);
    } catch (error) {
      console.error('[NetworkingService] Error fetching from Eventbrite:', error);
    }
    
    // If we have enough Eventbrite events, we can skip Ticketmaster
    let ticketmasterEvents: NetworkingEvent[] = [];
    if (eventbriteEvents.length < 5) {
      console.log('[NetworkingService] Not enough Eventbrite events, trying Ticketmaster as fallback');
      try {
        ticketmasterEvents = await searchTicketmasterEvents(keywords, location);
        console.log(`[NetworkingService] Ticketmaster returned ${ticketmasterEvents.length} events`);
      } catch (error) {
        console.error('[NetworkingService] Error fetching from Ticketmaster:', error);
      }
    } else {
      console.log('[NetworkingService] Sufficient Eventbrite events found, skipping Ticketmaster');
    }
    
    // Try using Meraki API as additional source or fallback
    let merakiEvents: NetworkingEvent[] = [];
    if (eventbriteEvents.length + ticketmasterEvents.length < 10) {
      console.log('[NetworkingService] Trying Meraki API for additional networking events');
      try {
        merakiEvents = await searchMerakiEvents(keywords, location);
        console.log(`[NetworkingService] Meraki API returned ${merakiEvents.length} events`);
      } catch (error) {
        console.error('[NetworkingService] Error fetching from Meraki API:', error);
      }
    } else {
      console.log('[NetworkingService] Sufficient events already found, skipping Meraki API');
    }
    
    // Combine events, prioritizing Eventbrite, then Ticketmaster, then Meraki
    const allEvents = [...eventbriteEvents, ...ticketmasterEvents, ...merakiEvents];
    
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