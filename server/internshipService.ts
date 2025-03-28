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
        
        const response = await axios.get('https://remotive.com/api/remote-jobs', {
          params: {
            search: searchQuery,
            limit: limit
          }
        });

        if (response.data && response.data.jobs && Array.isArray(response.data.jobs)) {
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

          if (filteredJobs.length > 0) {
            results.push({
              jobs: filteredJobs,
              source: 'remotive',
              query: term
            });
          }
        }
      } catch (error) {
        console.error(`Error searching Remotive for term "${term}":`, error);
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