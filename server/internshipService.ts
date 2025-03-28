import axios from 'axios';

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
 * Mock function for the Google Search API integration
 * In a real implementation, this would use the Google Custom Search API
 * @param searchTerms Array of search terms to query for
 * @returns Promise resolving to array of search results
 */
export async function searchGoogleForInternships(
  searchTerms: string[],
  limit: number = 3
): Promise<any[]> {
  // This is a placeholder function that would normally use the Google Custom Search API
  // For now, it returns mock data structured similarly to what we'd expect from Google
  
  const mockResults = searchTerms.map(term => {
    return {
      source: 'google',
      query: `${term} internship`,
      results: [
        {
          title: `${term} Internship Opportunities`,
          link: `https://www.example.com/internships/${term.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `Find the best ${term} internships for students and recent graduates. Apply now for opportunities at top companies.`
        },
        {
          title: `Summer ${term} Internship Program`,
          link: `https://www.example.org/summer-internships`,
          snippet: `Our summer internship program offers hands-on experience in ${term}. Ideal for college students looking to gain industry experience.`
        }
      ]
    };
  });
  
  return mockResults;
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
): Promise<{ remotive: InternshipSearchResult[], google?: any[] }> {
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
    
    // Search Remotive
    const remotiveResults = await searchRemotiveInternships(limitedTerms);
    
    // In a real implementation, we would also search Google
    // const googleResults = await searchGoogleForInternships(limitedTerms);
    
    return {
      remotive: remotiveResults,
      // google: googleResults
    };
  } catch (error) {
    console.error('Error finding internships:', error);
    return {
      remotive: []
    };
  }
}