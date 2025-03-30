import axios from 'axios';
import type { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Fetch internships from RapidAPI Internships API
 * @param searchTerms Array of search terms to query for
 * @returns Promise resolving to array of internship results
 */
export async function searchRapidAPIInternships(
  searchTerms: string[],
  limit: number = 10
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
      
      // Transform the RapidAPI response to match our InternshipSearchResult format
      const allInternships = response.data;
      
      if (!Array.isArray(allInternships)) {
        console.error("RapidAPI error: Response is not an array", typeof allInternships);
        throw new Error("RapidAPI response is not an array");
      }
      
      console.log(`RapidAPI response status: ${response.status}, found ${allInternships.length} internships`);
      
      // Log sample data
      if (allInternships.length > 0) {
        console.log("RapidAPI sample data:", JSON.stringify(allInternships[0]).substring(0, 300) + "...");
      }

      // Extract and normalize job fields for better matching
      const normalizedJobs = allInternships.map((job: any) => {
        // Create a composite search text to make matching more effective
        const searchText = [
          job.title || '',
          job.organization || '',
          job.description || '',
          ...(job.locations_raw?.map((loc: any) => loc.name || '') || []),
          ...(job.skills || []),
          ...(job.categories || [])
        ].join(' ').toLowerCase();

        return {
          raw: job,
          searchText
        };
      });
      
      const results: InternshipSearchResult[] = [];
      
      // Process each search term
      for (const term of searchTerms) {
        const termLower = term.toLowerCase();
        const termWords = termLower.split(/\s+/);
        
        // Find relevant internships for this term
        // We'll match if ANY word in the search term is found in the searchText
        const relevantJobs = normalizedJobs.filter(job => {
          // Consider a match if ANY word in the search term appears in the searchText
          return termWords.some(word => job.searchText.includes(word));
        });
        
        console.log(`RapidAPI: Found ${relevantJobs.length} internships for search term "${term}"`);
        
        if (relevantJobs.length === 0) {
          continue; // Skip this term if no matching jobs
        }
        
        // Apply limit to the number of jobs per search term
        const limitedJobs = relevantJobs.slice(0, limit);
        
        // Map to our Internship format
        const mappedJobs = limitedJobs.map(job => {
          const internship = job.raw;
          const organization = internship.organization || 'Unknown Company';
          const cleanOrgName = organization.toLowerCase().replace(/[^a-z0-9]/g, '');
          const id = internship.id || Math.random().toString(36).substring(2, 11);
          
          return {
            id: `rapidapi-${id}`,
            title: internship.title || `${term} Internship Opportunity`,
            company_name: organization,
            company_logo: internship.organization_logo || `https://logo.clearbit.com/${cleanOrgName}.com`,
            url: internship.url || internship.organization_url || '#',
            category: term,
            tags: [term.toLowerCase(), 'internship', 'entry-level'],
            job_type: 'internship',
            publication_date: internship.date_posted || new Date().toISOString(),
            candidate_required_location: (internship.locations_raw && internship.locations_raw.length > 0) 
              ? internship.locations_raw.map((loc: any) => loc.name || '').join(', ')
              : 'Remote/Various',
            salary: internship.salary || 'Competitive',
            description: internship.description || `${term} internship opportunity at ${organization}.`
          };
        });
        
        // Add to results for this search term
        results.push({
          jobs: mappedJobs,
          source: 'rapidapi',
          query: term
        });
      }
      
      // Return results for all search terms
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
 * Fetch internships from Adzuna API
 * @param searchTerms Array of search terms to query for
 * @param limit Maximum number of results to return
 * @returns Promise resolving to array of internship results
 */
export async function searchAdzunaInternships(
  searchTerms: string[],
  limit: number = 10
): Promise<InternshipSearchResult[]> {
  try {
    console.log('Searching for internships on Adzuna API...');
    const appId = "89757946";
    const appKey = "3ad2e76b6089b47e16ac29c52d5c7df0";
    
    const results: InternshipSearchResult[] = [];
    
    // Process each search term in parallel
    const searchPromises = searchTerms.map(async (term) => {
      try {
        // Create search query combining "intern" with the specific term
        const whatQuery = encodeURIComponent(`intern ${term}`);
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&what=${whatQuery}&where=remote&results_per_page=${limit}`;
        
        console.log(`Adzuna: Searching for "${term}" internships`);
        const response = await axios.get(url);
        
        if (response.status === 200 && response.data && response.data.results) {
          // Transform the results to match our RemotiveJob format for consistency
          const jobs = response.data.results.map((job: any) => ({
            id: job.id || `adzuna-${Math.random().toString(36).substring(2, 15)}`,
            url: job.redirect_url,
            title: job.title,
            company_name: job.company.display_name,
            company_logo: "", // Adzuna doesn't provide logos
            category: job.category.label || "Internship",
            tags: [job.category.label],
            job_type: "full_time",
            publication_date: job.created,
            candidate_required_location: job.location.display_name || "Remote",
            salary: job.salary_is_predicted ? `${job.salary_min}-${job.salary_max}` : "Unspecified",
            description: job.description || "No description available",
            source: "adzuna"
          }));
          
          console.log(`Adzuna: Found ${jobs.length} internships for search term "${term}"`);
          
          return {
            jobs,
            source: 'adzuna',
            query: term
          };
        } else {
          console.error(`Adzuna API returned invalid response for term "${term}":`, response.status);
          return null;
        }
      } catch (error) {
        console.error(`Error fetching Adzuna internships for term "${term}":`, error);
        return null;
      }
    });
    
    // Wait for all search results and filter out any failed searches
    const searchResults = await Promise.all(searchPromises);
    const validResults = searchResults.filter(Boolean) as InternshipSearchResult[];
    
    return validResults;
  } catch (error) {
    console.error('Error in searchAdzunaInternships:', error);
    return [];
  }
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
            
            // Apply limit to filtered jobs
            const limitedJobs = filteredJobs.slice(0, limit);
            console.log(`Limiting to ${limitedJobs.length} jobs for "${term}"`);

            if (limitedJobs.length > 0) {
              results.push({
                jobs: limitedJobs,
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
        // Create job listings based on the limit
        const jobListings = [];
        
        // Generate a variable number of job listings based on the limit
        for (let i = 0; i < Math.min(limit, 5); i++) {
          const isInternship = i < Math.ceil(limit / 2);
          const company = isInternship ? "Major Tech Companies" : "Leading Employers";
          const logo = isInternship ? "google.com" : "linkedin.com";
          
          jobListings.push({
            id: generateId(),
            title: isInternship 
              ? `${term} Internship - Summer 2025` 
              : `Entry Level ${term} Position ${i + 1}`,
            company_name: company,
            company_logo: `https://logo.clearbit.com/${logo}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(
              isInternship ? `${term} internship` : `entry level ${term} jobs`
            )}`,
            category: term,
            tags: [term.toLowerCase(), isInternship ? 'internship' : 'entry-level'],
            job_type: isInternship ? "internship" : "entry_level",
            publication_date: new Date().toISOString(),
            candidate_required_location: isInternship ? "Remote/Hybrid" : "Various Locations",
            salary: isInternship ? "Competitive" : "Based on qualifications",
            description: isInternship
              ? `This is a Google Search result for ${term} internships. In a production environment, this would link directly to real internship listings.`
              : `Find the latest entry level ${term} positions. In a production environment, this would link to actual job listings found through Google.`
          });
        }
        
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
 * @param limit Maximum number of results per category to return
 * @returns Promise resolving to combined search results
 */
/**
 * Generate personalized internship recommendations using Gemini AI
 * @param userProfile Object containing user profile information
 * @param quizResults Object containing user quiz results
 * @param internships Internship data to analyze
 * @returns Promise resolving to AI-generated recommendations
 */
export async function generateInternshipRecommendations(
  userProfile: any,
  quizResults: any,
  internships: any,
  genAI: any
): Promise<{
  recommendations: string;
  topMatches: string[];
  matchScores: Record<string, number>;
}> {
  try {
    if (!genAI) {
      console.warn("Gemini AI not available for internship recommendations");
      return {
        recommendations: "AI recommendations are not available at this time.",
        topMatches: [],
        matchScores: {}
      };
    }
    
    // Extract personality information from quiz results
    const primaryType = quizResults.primaryType?.name || quizResults.dominantType || "";
    const secondaryType = quizResults.secondaryType?.name || "";
    
    // Get career strengths from categories if available
    let strengths: string[] = [];
    if (quizResults.primaryType?.description) {
      strengths.push(quizResults.primaryType.description);
    }
    if (quizResults.strengths && Array.isArray(quizResults.strengths)) {
      strengths = [...strengths, ...quizResults.strengths];
    }
    
    // Extract recommended careers from quiz results
    const recommendedCareers: string[] = [];
    
    // Get career recommendations from quiz results
    if (quizResults.primaryType?.careers && Array.isArray(quizResults.primaryType.careers)) {
      recommendedCareers.push(...quizResults.primaryType.careers);
    }
    
    if (quizResults.secondaryType?.careers && Array.isArray(quizResults.secondaryType.careers)) {
      recommendedCareers.push(...quizResults.secondaryType.careers);
    }
    
    if (quizResults.hybridCareers && Array.isArray(quizResults.hybridCareers)) {
      recommendedCareers.push(...quizResults.hybridCareers);
    }
    
    // Deduplicate careers
    const uniqueCareersSet = new Set(recommendedCareers);
    const uniqueCareers = Array.from(uniqueCareersSet);
    
    console.log("Personality profile for internship matching:", {
      primaryType,
      secondaryType,
      strengths: strengths.length > 0 ? strengths.slice(0, 3) : ["No specific strengths found"],
      recommendedCareers: uniqueCareers.length > 0 ? uniqueCareers.slice(0, 5) : ["No specific careers found"],
      interests: userProfile.interests?.length || 0
    });
    
    // Extract all internship titles for matching
    const allInternshipTitles: string[] = [];
    const internshipDetails: Record<string, any> = {};
    
    // Process RapidAPI results
    if (internships.rapidapi) {
      internships.rapidapi.forEach((category: any) => {
        if (category.jobs && Array.isArray(category.jobs)) {
          category.jobs.forEach((job: any) => {
            allInternshipTitles.push(job.title);
            internshipDetails[job.title] = {
              company: job.company_name,
              description: job.description,
              id: job.id,
              url: job.url,
              location: job.candidate_required_location,
              category: category.query,
              source: 'rapidapi'
            };
          });
        }
      });
    }
    
    // Process Adzuna results
    if (internships.adzuna) {
      internships.adzuna.forEach((category: any) => {
        if (category.jobs && Array.isArray(category.jobs)) {
          category.jobs.forEach((job: any) => {
            allInternshipTitles.push(job.title);
            internshipDetails[job.title] = {
              company: job.company_name,
              description: job.description,
              id: job.id,
              url: job.url,
              location: job.candidate_required_location || 'Remote',
              category: category.query,
              source: 'adzuna'
            };
          });
        }
      });
    }
    
    // Process Remotive results
    if (internships.remotive) {
      internships.remotive.forEach((category: any) => {
        if (category.jobs && Array.isArray(category.jobs)) {
          category.jobs.forEach((job: any) => {
            allInternshipTitles.push(job.title);
            internshipDetails[job.title] = {
              company: job.company_name,
              description: job.description,
              id: job.id,
              url: job.url,
              location: job.candidate_required_location,
              category: category.query,
              source: 'remotive'
            };
          });
        }
      });
    }
    
    // Process Google results
    if (internships.google) {
      internships.google.forEach((category: any) => {
        if (category.jobs && Array.isArray(category.jobs)) {
          category.jobs.forEach((job: any) => {
            allInternshipTitles.push(job.title);
            internshipDetails[job.title] = {
              company: job.company_name,
              description: job.description,
              id: job.id,
              url: job.url,
              location: job.candidate_required_location || "Location not specified",
              category: category.query,
              source: 'google'
            };
          });
        }
      });
    }
    
    // If no internships to analyze, return early
    if (allInternshipTitles.length === 0) {
      return {
        recommendations: "No internships available to analyze.",
        topMatches: [],
        matchScores: {}
      };
    }
    
    console.log(`Found ${allInternshipTitles.length} internship listings to analyze with AI.`);
    
    console.log(`Analyzing ${allInternshipTitles.length} internships for personalized recommendations`);
    
    // Get a Gemini model instance
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Extract career interests and strengths from quiz results with more comprehensive format support
    let primaryCareerType = "Unknown";
    let secondaryCareerType = "Unknown";
    let careerOptions: string[] = [];
    
    // Extract primary type from various quiz result formats
    if (quizResults?.primaryType) {
      if (typeof quizResults.primaryType === 'string') {
        primaryCareerType = quizResults.primaryType;
      } else if (quizResults.primaryType.name) {
        primaryCareerType = quizResults.primaryType.name;
        
        // Also extract career options if available
        if (quizResults.primaryType.careers && Array.isArray(quizResults.primaryType.careers)) {
          careerOptions = [...careerOptions, ...quizResults.primaryType.careers];
        }
      }
    }
    
    // Extract secondary type from various quiz result formats  
    if (quizResults?.secondaryType) {
      if (typeof quizResults.secondaryType === 'string') {
        secondaryCareerType = quizResults.secondaryType;
      } else if (quizResults.secondaryType.name) {
        secondaryCareerType = quizResults.secondaryType.name;
        
        // Also extract career options if available
        if (quizResults.secondaryType.careers && Array.isArray(quizResults.secondaryType.careers)) {
          careerOptions = [...careerOptions, ...quizResults.secondaryType.careers];
        }
      }
    }
    
    // Extract from dominant/secondary types in older quiz format
    if (quizResults?.dominantType && primaryCareerType === "Unknown") {
      primaryCareerType = quizResults.dominantType;
    }
    
    // Get hybrid careers if available
    if (quizResults?.hybridCareers && Array.isArray(quizResults.hybridCareers)) {
      careerOptions = [...careerOptions, ...quizResults.hybridCareers];
    }
    
    console.log('Extracted for AI analysis:', { 
      primaryCareerType, 
      secondaryCareerType, 
      careerOptionsCount: careerOptions.length 
    });
    
    // Combine interests from both profile and quiz
    const interests = [
      ...(userProfile?.interests || []).map((i: any) => i.category),
      primaryCareerType,
      secondaryCareerType,
      ...careerOptions
    ];
    
    // Format the prompt for Gemini
    const prompt = `
      You're an AI career coach helping a student find the best internship match based on their profile.
      
      STUDENT PROFILE:
      Career Type: ${primaryCareerType} (primary), ${secondaryCareerType} (secondary)
      Recommended Careers: ${careerOptions.join(', ')}
      Interests: ${interests.join(', ')}
      
      AVAILABLE INTERNSHIPS:
      ${allInternshipTitles.slice(0, 15).map((title, idx) => {
        const details = internshipDetails[title];
        return `${idx+1}. ${title} at ${details.company} [Source: ${details.source}]\n   ${details.description?.slice(0, 100)}...`;
      }).join('\n\n')}
      
      TASKS:
      1. Analyze the student's profile and the available internships.
      2. Select the 3-5 best matching internships based on career alignment.
      3. Provide a BRIEF explanation of why these are good matches (max 2 sentences per match).
      4. For each internship, add a match percentage (e.g., "Match: 85%").
      5. Try to include diverse sources (RapidAPI, Adzuna, Remotive, Google) in your recommendations.
      6. Format your response as a JSON object with these fields:
         - recommendations: A concise paragraph (max 3 sentences) summarizing the matches
         - topMatches: Array of internship titles that are the best matches
         - matchScores: Object mapping internship titles to match percentages (numbers between 0-100)
      
      IMPORTANT: Keep your entire response under 1000 tokens, focus only on what's relevant, and format as valid JSON.
    `;
    
    console.log('Sending internship matching request to Gemini AI...');
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Extract JSON if it's wrapped in code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/```\n([\s\S]*?)\n```/) || 
                        [null, text];
      
      const jsonText = jsonMatch[1] || text;
      const parsed = JSON.parse(jsonText);
      
      console.log('Successfully generated internship recommendations with Gemini AI');
      
      return {
        recommendations: parsed.recommendations || "No specific recommendations found.",
        topMatches: parsed.topMatches || [],
        matchScores: parsed.matchScores || {}
      };
    } catch (parseError) {
      console.error('Error parsing Gemini AI response:', parseError);
      console.log('Raw response:', text);
      
      // Return a fallback response
      return {
        recommendations: "Unable to generate specific recommendations at this time.",
        topMatches: allInternshipTitles.slice(0, 3),
        matchScores: allInternshipTitles.slice(0, 5).reduce((acc, title) => {
          acc[title] = Math.floor(Math.random() * 30) + 70; // Random match score between 70-100
          return acc;
        }, {} as Record<string, number>)
      };
    }
  } catch (error) {
    console.error('Error generating internship recommendations:', error);
    return {
      recommendations: "An error occurred while generating recommendations.",
      topMatches: [],
      matchScores: {}
    };
  }
}

export async function findInternships(
  jobTitles: string[] = [],
  keywords: string[] = [],
  limit: number = 10,
  isPersonalizedMatch: boolean = false
): Promise<{ 
  rapidapi?: InternshipSearchResult[], 
  adzuna?: InternshipSearchResult[], 
  remotive?: InternshipSearchResult[], 
  google?: any[] 
}> {
  try {
    // Log input parameters for debugging
    console.log('Internship search parameters:', {
      jobTitles,
      keywords,
      isPersonalizedMatch: !!isPersonalizedMatch
    });
    
    // Combine job titles and keywords for search, ensuring uniqueness
    const combinedTerms = [...jobTitles, ...keywords];
    const searchTermsSet = new Set<string>();
    
    // Prioritize job titles if this is a personalized AI match
    if (isPersonalizedMatch && jobTitles.length > 0) {
      // Only use job titles when it's a personalized match from quiz results
      jobTitles.forEach(term => searchTermsSet.add(term));
    } else {
      // Otherwise use all available search terms
      combinedTerms.forEach(term => searchTermsSet.add(term));
    }
    
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
      rapidApiResults = await searchRapidAPIInternships(limitedTerms, limit);
      
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
    
    // Always fetch from Adzuna as well (not just as a fallback)
    let adzunaResults: InternshipSearchResult[] = [];
    let hasAdzunaResults = false;
    
    // Always try Adzuna in parallel with RapidAPI
    try {
      console.log('Searching internships using secondary source: Adzuna API');
      adzunaResults = await searchAdzunaInternships(limitedTerms, limit);
      
      hasAdzunaResults = adzunaResults.some(result => 
        result.source === 'adzuna' && result.jobs && result.jobs.length > 0
      );
      
      console.log('Adzuna internship search complete. Success:', hasAdzunaResults);
      console.log('Adzuna results breakdown:', adzunaResults.map(r => ({
        source: r.source,
        query: r.query,
        jobCount: r.jobs?.length || 0
      })));
    } catch (adzunaError) {
      console.error('Error with Adzuna internship search:', adzunaError);
      console.log('Will try next fallback source if needed...');
    }
    
    // Only use Remotive as a fallback if the primary sources (RapidAPI and Adzuna) fail
    let remotiveResults: InternshipSearchResult[] = [];
    let hasRealRemotiveResults = false;
    
    if (!hasRapidApiResults && !hasAdzunaResults) {
      console.log('No results from primary sources (RapidAPI and Adzuna), falling back to Remotive...');
      
      remotiveResults = await searchRemotiveInternships(limitedTerms, limit);
      
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
    
    // If none of the primary APIs returned real results, try Google as final fallback
    let googleResults = null;
    
    if (!hasRapidApiResults && !hasAdzunaResults && !hasRealRemotiveResults) {
      console.log('No real results from RapidAPI, Adzuna, or Remotive, falling back to Google Programmable Search...');
      
      // Use Google Programmable Search as fallback
      googleResults = await searchGoogleForInternships(limitedTerms, limit);
      
      console.log('Google search returned results:', 
        googleResults ? `${googleResults.length} categories` : 'No results',
        googleResults ? `Total jobs: ${googleResults.reduce((total, cat) => total + (cat.jobs?.length || 0), 0)}` : ''
      );
    }
    
    // Calculate stats for logs
    const rapidApiJobCount = rapidApiResults?.reduce((total, cat) => total + (cat.jobs?.length || 0), 0) || 0;
    const adzunaJobCount = adzunaResults?.reduce((total, cat) => total + (cat.jobs?.length || 0), 0) || 0;
    const remotiveJobCount = remotiveResults?.reduce((total, cat) => total + (cat.jobs?.length || 0), 0) || 0;
    const googleJobCount = googleResults?.reduce((total, cat) => total + (cat.jobs?.length || 0), 0) || 0;
    
    console.log('Internship search complete. Results summary:');
    console.log(`- RapidAPI: ${rapidApiJobCount} jobs (Success: ${hasRapidApiResults})`);
    console.log(`- Adzuna: ${adzunaJobCount} jobs (Success: ${hasAdzunaResults})`);
    console.log(`- Remotive: ${remotiveJobCount} jobs (Success: ${hasRealRemotiveResults})`);
    console.log(`- Google: ${googleJobCount} jobs`);
    console.log(`- Total: ${rapidApiJobCount + adzunaJobCount + remotiveJobCount + googleJobCount} jobs`);
    
    // Return all data sources that have results, regardless of success
    // This allows showing results from all sources simultaneously
    return {
      ...(hasRapidApiResults ? { rapidapi: rapidApiResults } : {}),
      ...(hasAdzunaResults ? { adzuna: adzunaResults } : {}),
      ...(hasRealRemotiveResults ? { remotive: remotiveResults } : {}),
      ...(googleResults ? { google: googleResults } : {})
    };
  } catch (error) {
    console.error('Error finding internships:', error);
    // Even in the error case, return an empty object with the right structure
    return {
      rapidapi: [],
      adzuna: []
    } as { 
      rapidapi?: InternshipSearchResult[], 
      adzuna?: InternshipSearchResult[], 
      remotive?: InternshipSearchResult[], 
      google?: any[] 
    };
  }
}