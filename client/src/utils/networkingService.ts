import { apiRequest } from '@/lib/queryClient';

// Type interface for standard networking events
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
  source: "eventbrite" | "ticketmaster" | "meraki" | "predicthq" | "generated" | "webscrape" | "google";
  image?: string;
  relevanceScore?: number;
}

/**
 * Fetch networking events based on quiz results and career preferences
 * @param quizResults User's quiz results containing career preferences
 * @param options Additional options for fetching events
 * @returns Promise resolving to array of networking events
 */
export async function fetchNetworkingEvents(
  quizResults: any,
  options?: {
    location?: string;
    additionalInterests?: string[];
  }
): Promise<{
  success: boolean;
  events: NetworkingEvent[];
  count: number;
  message: string;
  apiStatus?: {
    eventbrite: string;
    ticketmaster: string;
    predicthq: string;
    google: string;
    webscrape: string;
    meraki: string;
  };
  sources?: {
    eventbrite: number;
    ticketmaster: number;
    predicthq: number;
    google: number;
    webscrape: number;
    meraki: number;
  };
}> {
  try {
    // Build request payload
    const payload = {
      quizResults,
      location: options?.location,
      careerInterests: options?.additionalInterests
    };
    
    // Make API request
    const response = await apiRequest('POST', '/api/networking/events', payload);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching networking events:', error);
    return {
      success: false,
      events: [],
      count: 0,
      message: error instanceof Error 
        ? `Error fetching networking events: ${error.message}` 
        : 'Unknown error fetching networking events'
    };
  }
}

/**
 * Fetch networking events directly by search terms
 * @param searchTerms Search terms to use for finding events
 * @param location Optional location to search in
 * @returns Promise resolving to array of networking events
 */
export async function searchNetworkingEvents(
  searchTerms: string[], 
  location?: string
): Promise<{
  success: boolean;
  events: NetworkingEvent[];
  count: number;
  message: string;
  apiStatus?: {
    eventbrite: string;
    ticketmaster: string;
    predicthq: string;
    google: string;
    webscrape: string;
    meraki: string;
  };
  sources?: {
    eventbrite: number;
    ticketmaster: number;
    predicthq: number;
    google: number;
    webscrape: number;
    meraki: number;
  };
}> {
  try {
    // Convert search terms to career interests format for API
    const careerInterests = searchTerms.filter(term => term.trim() !== '');
    
    if (careerInterests.length === 0) {
      return {
        success: false,
        events: [],
        count: 0,
        message: 'Please provide at least one search term'
      };
    }
    
    // Build query string
    const queryParams = new URLSearchParams();
    careerInterests.forEach(term => queryParams.append('careerInterests', term));
    
    if (location) {
      queryParams.append('location', location);
    }
    
    // Make API request
    const response = await apiRequest('GET', `/api/networking/events?${queryParams.toString()}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error searching networking events:', error);
    return {
      success: false,
      events: [],
      count: 0,
      message: error instanceof Error 
        ? `Error searching networking events: ${error.message}` 
        : 'Unknown error searching networking events'
    };
  }
}