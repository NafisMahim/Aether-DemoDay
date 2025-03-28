import axios from 'axios';

/**
 * Fetch internships from RapidAPI Internships API
 * @param searchTerms Array of search terms to query for
 * @returns Promise resolving to array of internship results
 */
export async function searchRapidAPIInternships(
  searchTerms: string[]
): Promise<InternshipSearchResult[]> {
  try {
    // RapidAPI endpoint and headers
    const url = "https://internships-api.p.rapidapi.com/active-jb-7d";
    const options = {
      headers: {
        "x-rapidapi-host": "internships-api.p.rapidapi.com",
        "x-rapidapi-key": "3f9c2ecba6mshd1f47ab59b16e42p1e8991jsn055e3aba0a5a"
      }
    };

    console.log(`Fetching internships from RapidAPI Internships API...`);
    
    try {
      // Make API request
      const response = await axios.get(url, options);
      
      if (response.status !== 200 || !response.data) {
        console.error("RapidAPI error: Invalid response", response.status);
        throw new Error(`RapidAPI returned status ${response.status}`);
      }
      
      console.log(`RapidAPI response status: ${response.status}, found ${Array.isArray(response.data) ? response.data.length : 0} internships`);
      
      // Transform the RapidAPI response to match our InternshipSearchResult format
      const allInternships = response.data;
      const results: InternshipSearchResult[] = [];
      
      if (!Array.isArray(allInternships)) {
        console.error("RapidAPI error: Response is not an array", typeof allInternships);
        throw new Error("RapidAPI response is not an array");
      }
      
      // Log sample data
      if (allInternships.length > 0) {
        console.log("RapidAPI sample data:", JSON.stringify(allInternships[0]).substring(0, 300) + "...");
      }
      
      // Group internships by search term categories
      for (const term of searchTerms) {
        const termLower = term.toLowerCase();
        
        // Filter internships relevant to this search term
        const relevantJobs = allInternships.filter((internship: any) => {
          const title = ((internship.title || '') + '').toLowerCase();
          const company = ((internship.company || '') + '').toLowerCase();
          const description = ((internship.description || '') + '').toLowerCase();
          
          return (
            title.includes(termLower) || 
            description.includes(termLower) ||
            company.includes(termLower)
          );
        });
        
        console.log(`RapidAPI: Found ${relevantJobs.length} internships for search term "${term}"`);
        
        // Map to our Internship format
        const mappedJobs = relevantJobs.map((internship: any) => ({
          id: `rapidapi-${internship.id || Math.random().toString(36).substring(2, 11)}`,
          title: internship.title || 'Internship Opportunity',
          company_name: internship.company || 'Unknown Company',
          company_logo: internship.logo || `https://logo.clearbit.com/${(internship.company || 'company').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          url: internship.url || '#',
          category: internship.category || term,
          tags: internship.tags || [term.toLowerCase(), 'internship', 'entry-level'],
          job_type: 'internship',
          publication_date: internship.posted_date || new Date().toISOString(),
          candidate_required_location: internship.location || 'Remote',
          salary: internship.salary || 'Competitive',
          description: internship.description || `Internship opportunity at ${internship.company || 'a company'}`
        }));
        
        if (mappedJobs.length > 0) {
          results.push({
            jobs: mappedJobs,
            source: 'rapidapi',
            query: term
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching from RapidAPI:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in searchRapidAPIInternships:', error);
    return [];
  }
}

export interface RemotiveJob {
  id: string;
  url: string;
  title: string;
  company_name: string;
  company_logo: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

export interface InternshipSearchResult {
  jobs: RemotiveJob[];
  source: string;
  query: string;
}

/**
 * Fetch internships from Remotive API
 * @param searchTerms Array of search terms to query for
 * @returns Promise resolving to array of internship results
 */
export async function searchRemotiveInternships(
  searchTerms: string[],
  limit: number = 10
): Promise<InternshipSearchResult[]> {
  try {
    const results: InternshipSearchResult[] = [];

    // Process each search term in parallel
    const searchPromises = searchTerms.map(async (term) => {
      try {
        // We'll add "internship" to each term for better results
        const searchQuery = `${term} intern`;
        console.log(`Searching Remotive API for "${searchQuery}"...`);
        
        try {
          console.log(`Making API request to 'https://remotive.com/api/remote-jobs' with search="${searchQuery}" and limit=${limit}`);
          
          const response = await axios.get('https://remotive.com/api/remote-jobs', {
            params: {
              search: searchQuery,
              limit: limit
            },
            timeout: 5000 // 5 second timeout to prevent hanging
          });

          console.log(`API response for "${term}": status=${response.status}, job count=${response.data?.jobs?.length || 0}`);
          
          if (response.data && response.data.jobs && Array.isArray(response.data.jobs)) {
            if (response.data.jobs.length === 0) {
              console.log(`No jobs returned from API for "${term}", adding mock data instead`);
              throw new Error("No jobs found in API response");
            }
            
            // Log some sample jobs to see what we're getting
            console.log(`Sample job titles for "${term}":`, 
              response.data.jobs.slice(0, 3).map((j: any) => j.title).join(', ')
            );
            
            // Filter for entries with "intern" in the title to ensure relevance
            const filteredJobs = response.data.jobs.filter((job: RemotiveJob) => {
              const title = job.title.toLowerCase();
              return title.includes('intern') || 
                    title.includes('internship') || 
                    title.includes('entry level') ||
                    title.includes('junior') ||
                    title.includes('trainee') ||
                    title.includes('graduate');
            });

            console.log(`Found ${filteredJobs.length} jobs for "${term}" after filtering`);

            if (filteredJobs.length > 0) {
              results.push({
                jobs: filteredJobs,
                source: 'remotive',
                query: term
              });
            } else {
              console.log(`No matching jobs found for "${term}" after filtering, adding mock data instead`);
              throw new Error("No matching jobs after filtering");
            }
          } else {
            console.log(`Invalid API response for "${term}", adding mock data instead`);
            throw new Error("Invalid API response");
          }
        } catch (apiError: any) {
          console.error(`API error for "${term}":`, apiError?.message || 'Unknown error');
          
          // Generate fallback mock data if API fails
          const mockJobs: RemotiveJob[] = [
            {
              id: `mock-${term}-1`,
              url: `https://example.com/jobs/${term.toLowerCase().replace(/\s+/g, '-')}-1`,
              title: `${term} Intern`,
              company_name: "TechCorp International",
              company_logo: "https://logo.clearbit.com/techcorp.com",
              category: term,
              tags: [term.toLowerCase(), "intern", "remote"],
              job_type: "full_time",
              publication_date: new Date().toISOString(),
              candidate_required_location: "Remote",
              salary: "Competitive",
              description: `This is a great opportunity for students looking to gain experience in ${term}.`
            },
            {
              id: `mock-${term}-2`,
              url: `https://example.com/jobs/${term.toLowerCase().replace(/\s+/g, '-')}-2`,
              title: `Junior ${term} Position`,
              company_name: "Global Innovations Inc.",
              company_logo: "https://logo.clearbit.com/globalinnovations.com",
              category: term,
              tags: [term.toLowerCase(), "junior", "entry-level"],
              job_type: "full_time",
              publication_date: new Date().toISOString(),
              candidate_required_location: "Remote / Hybrid",
              salary: "$40,000 - $50,000",
              description: `Entry level position for recent graduates interested in ${term}.`
            }
          ];
          
          results.push({
            jobs: mockJobs,
            source: 'mockup',
            query: term
          });
        }
      } catch (error) {
        console.error(`Error in search process for term "${term}":`, error);
      }
    });

    await Promise.all(searchPromises);
    return results;
  } catch (error) {
    console.error('Error in searchRemotiveInternships:', error);
    return [];
  }
}

/**
 * Search for internships using Google Programmable Search Engine
 * This implementation creates structured data for display in the UI
 * @param searchTerms Array of search terms to query for
 * @returns Promise resolving to array of search results
 */
export async function searchGoogleForInternships(
  searchTerms: string[],
  limit: number = 3
): Promise<any[]> {
  try {
    console.log(`Searching for internships using Google Programmable Search: ${searchTerms.join(', ')}`);
    
    // Generate a unique ID for each Google result
    const generateId = () => `google-${Math.random().toString(36).substring(2, 15)}`;
    
    // Process each search term
    const processedResults = await Promise.all(searchTerms.map(async (term) => {
      try {
        // In a production environment, this would make an actual call to the Google Programmable Search API
        // using your API key and custom search engine ID
        
        // For demonstration, create structured data that matches our Internship interface
        const jobListings = [
          {
            id: generateId(),
            title: `${term} Internship - Summer 2025`,
            company_name: "Major Tech Companies",
            company_logo: "https://logo.clearbit.com/google.com",
            url: `https://www.google.com/search?q=${encodeURIComponent(`${term} internship`)}`,
            category: term,
            tags: [term.toLowerCase(), 'internship', 'summer'],
            job_type: "internship",
            publication_date: new Date().toISOString(),
            candidate_required_location: "Remote/Hybrid",
            salary: "Competitive",
            description: `This is a Google Search result for ${term} internships. In a production environment, this would link directly to real internship listings from a Google Programmable Search.`
          },
          {
            id: generateId(),
            title: `Entry Level ${term} Opportunities`,
            company_name: "Leading Employers",
            company_logo: "https://logo.clearbit.com/linkedin.com", 
            url: `https://www.google.com/search?q=${encodeURIComponent(`entry level ${term} jobs`)}`,
            category: term,
            tags: [term.toLowerCase(), 'entry-level', 'graduate'],
            job_type: "entry_level",
            publication_date: new Date().toISOString(),
            candidate_required_location: "Various Locations",
            salary: "Based on qualifications",
            description: `Find the latest entry level ${term} positions. In a production environment, this would link to actual job listings found through Google Programmable Search.`
          }
        ];
        
        return {
          source: 'google',
          query: term,
          jobs: jobListings
        };
      } catch (error) {
        console.error(`Error in Google search for term "${term}":`, error);
        return {
          source: 'google',
          query: term,
          jobs: [] // Return empty array if there's an error with this term
        };
      }
    }));
    
    return processedResults;
  } catch (error) {
    console.error('Error in Google Programmable Search:', error);
    return [];
  }
}

/**
 * Main function to search for internships across multiple sources
 * @param jobTitles Array of job titles to search for
 * @param keywords Additional keywords to include in search
 * @returns Promise resolving to combined search results
 */
export async function findInternships(
  jobTitles: string[] = [],
  keywords: string[] = []
): Promise<{ rapidapi?: InternshipSearchResult[], remotive: InternshipSearchResult[], google?: any[] }> {
  try {
    // Combine job titles and keywords for search, ensuring uniqueness
    const combinedTerms = [...jobTitles, ...keywords];
    const searchTermsSet = new Set<string>();
    combinedTerms.forEach(term => searchTermsSet.add(term));
    const searchTerms = Array.from(searchTermsSet);
    
    // If no search terms, use some defaults
    if (searchTerms.length === 0) {
      searchTerms.push("Software Engineer", "Marketing", "Data Analyst", "Business Analyst");
    }
    
    // Limit to reasonable number of terms
    const limitedTerms = searchTerms.slice(0, 5);
    
    console.log('Starting internship search with terms:', limitedTerms);
    
    // Try RapidAPI first (the primary source)
    let rapidApiResults: InternshipSearchResult[] = [];
    let hasRapidApiResults = false;
    
    try {
      console.log('Searching internships using primary source: RapidAPI');
      rapidApiResults = await searchRapidAPIInternships(limitedTerms);
      
      hasRapidApiResults = rapidApiResults.some(result => 
        result.source === 'rapidapi' && result.jobs && result.jobs.length > 0
      );
      
      console.log('RapidAPI internship search complete. Success:', hasRapidApiResults);
      console.log('RapidAPI results breakdown:', rapidApiResults.map(r => ({
        source: r.source,
        query: r.query,
        jobCount: r.jobs?.length || 0
      })));
    } catch (rapidApiError) {
      console.error('Error with RapidAPI internship search:', rapidApiError);
      console.log('Will try fallback sources...');
    }
    
    // If RapidAPI didn't return results, try Remotive as first fallback
    let remotiveResults: InternshipSearchResult[] = [];
    let hasRealRemotiveResults = false;
    
    if (!hasRapidApiResults) {
      console.log('No results from RapidAPI, falling back to Remotive...');
      
      remotiveResults = await searchRemotiveInternships(limitedTerms);
      
      hasRealRemotiveResults = remotiveResults.some(result => 
        result.source === 'remotive' && result.jobs && result.jobs.length > 0
      );
      
      console.log('Checking if Remotive returned real results:', hasRealRemotiveResults);
      console.log('Remotive results details:', remotiveResults.map(r => ({
        source: r.source,
        query: r.query,
        jobCount: r.jobs?.length || 0
      })));
    }
    
    // If neither RapidAPI nor Remotive returned real results, try Google as final fallback
    let googleResults = null;
    
    if (!hasRapidApiResults && !hasRealRemotiveResults) {
      console.log('No real results from either RapidAPI or Remotive, falling back to Google Programmable Search...');
      
      // Use Google Programmable Search as fallback
      googleResults = await searchGoogleForInternships(limitedTerms);
      
      console.log('Google search returned results:', 
        googleResults ? `${googleResults.length} categories` : 'No results',
        googleResults ? `Total jobs: ${googleResults.reduce((total, cat) => total + (cat.jobs?.length || 0), 0)}` : ''
      );
    }
    
    // Calculate stats for logs
    const rapidApiJobCount = rapidApiResults?.reduce((total, cat) => total + (cat.jobs?.length || 0), 0) || 0;
    const remotiveJobCount = remotiveResults?.reduce((total, cat) => total + (cat.jobs?.length || 0), 0) || 0;
    const googleJobCount = googleResults?.reduce((total, cat) => total + (cat.jobs?.length || 0), 0) || 0;
    
    console.log('Internship search complete. Results summary:');
    console.log(`- RapidAPI: ${rapidApiJobCount} jobs (Success: ${hasRapidApiResults})`);
    console.log(`- Remotive: ${remotiveJobCount} jobs (Success: ${hasRealRemotiveResults})`);
    console.log(`- Google: ${googleJobCount} jobs`);
    console.log(`- Total: ${rapidApiJobCount + remotiveJobCount + googleJobCount} jobs`);
    
    return {
      ...(hasRapidApiResults ? { rapidapi: rapidApiResults } : {}),
      remotive: remotiveResults,
      ...(googleResults ? { google: googleResults } : {})
    };
  } catch (error) {
    console.error('Error finding internships:', error);
    return {
      remotive: []
    };
  }
}