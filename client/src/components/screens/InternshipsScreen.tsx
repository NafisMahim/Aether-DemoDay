import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { matchQuizResultsToCategories, getJobSearchTerms } from "../../utils/careerMappings"

interface InternshipsScreenProps {
  handleBack: () => void
  quizResults: any
  interests: any[]
}

interface Internship {
  id: string
  title: string
  company_name: string
  company_logo?: string
  url: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary?: string
  description: string
}

export default function InternshipsScreen({ handleBack, quizResults, interests }: InternshipsScreenProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [internships, setInternships] = useState<Internship[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [careerCategories, setCareerCategories] = useState<string[]>([])
  const [categoryJobs, setCategoryJobs] = useState<Record<string, Internship[]>>({})
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null)

  // Search for internships based on quiz results and interests
  useEffect(() => {
    const searchForInternships = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Match career categories based on quiz results and interests
        const matchedCategories = matchQuizResultsToCategories({
          ...quizResults,
          interests: interests
        })
        
        if (matchedCategories.length === 0) {
          setError("Unable to determine career categories from your profile. Please complete the career quiz or add more interests.")
          setIsLoading(false)
          return
        }
        
        setCareerCategories(matchedCategories)
        
        // Get job titles and keywords for search
        const { jobTitles, keywords } = getJobSearchTerms(matchedCategories)
        
        // Call the API to search for internships
        const response = await apiRequest('POST', '/api/internships/search', {
          jobTitles,
          keywords
        })
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.message || "Failed to search for internships")
        }
        
        // Handle API status message if present
        if (data.message) {
          console.log("API message:", data.message)
          
          if (data.apiStatus === 'unavailable' && data.totalJobs > 0) {
            setApiStatusMessage(data.message)
            toast({
              title: "Note",
              description: data.message,
              variant: "default"
            })
          } else {
            setApiStatusMessage(null)
          }
        }
        
        // Process the results
        const allInternships: Internship[] = []
        const internshipsByCategory: Record<string, Internship[]> = {}
        
        // Process Remotive results
        if (data.results.remotive && Array.isArray(data.results.remotive)) {
          console.log("Processing remotive results:", data.results.remotive);
          data.results.remotive.forEach((result: any) => {
            if (!result || !result.query) {
              console.warn("Invalid result object:", result);
              return;
            }
            
            const categoryName = result.query;
            const categoryJobs = result.jobs || [];
            
            console.log(`Processing category ${categoryName} with ${categoryJobs.length} jobs`);
            
            if (!internshipsByCategory[categoryName]) {
              internshipsByCategory[categoryName] = [];
            }
            
            internshipsByCategory[categoryName] = [
              ...internshipsByCategory[categoryName],
              ...categoryJobs
            ];
            
            allInternships.push(...categoryJobs);
          });
        } else {
          console.warn("No remotive results found in API response:", data.results);
        }
        
        // Process Google search results if available
        if (data.results.google && Array.isArray(data.results.google)) {
          console.log("Processing Google search results:", data.results.google);
          
          // Update API status message to inform user we're using Google search
          if (data.apiStatus?.remotive === 'unavailable' && apiStatusMessage) {
            setApiStatusMessage('The Remotive API is currently not returning results. Showing Google search results as an alternative.');
          }
          
          data.results.google.forEach((result: any) => {
            if (!result || !result.query) {
              console.warn("Invalid Google result object:", result);
              return;
            }
            
            const categoryName = result.query;
            const categoryJobs = result.jobs || [];
            
            console.log(`Processing Google category ${categoryName} with ${categoryJobs.length} jobs`);
            
            if (!internshipsByCategory[categoryName]) {
              internshipsByCategory[categoryName] = [];
            }
            
            // Add Google results to the category
            internshipsByCategory[categoryName] = [
              ...internshipsByCategory[categoryName],
              ...categoryJobs
            ];
            
            allInternships.push(...categoryJobs);
          });
          
          // Log the complete data after processing
          console.log("Final internships data:", {
            categories: Object.keys(internshipsByCategory),
            totalJobs: allInternships.length,
            googleJobs: allInternships.filter(job => job.id.toString().startsWith('google-')).length
          });
        }
        
        // Set the internships data
        setInternships(allInternships)
        setCategoryJobs(internshipsByCategory)
        
        // Select first category by default
        if (matchedCategories.length > 0 && Object.keys(internshipsByCategory).length > 0) {
          setSelectedCategory(Object.keys(internshipsByCategory)[0])
        }
        
        if (allInternships.length === 0) {
          setError("No internships found matching your profile. Try updating your interests or career assessment.")
        }
      } catch (err) {
        console.error("Error searching for internships:", err)
        setError("Failed to find internships. Please try again later.")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "An error occurred",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    searchForInternships()
  }, [quizResults, interests, toast])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center">
        <button className="mr-3" onClick={handleBack}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold">Internship Finder</h1>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-600">
            Discover internship opportunities tailored to your career profile and interests.
          </p>
        </div>
        
        {/* API Status Banner */}
        {!isLoading && apiStatusMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 mb-4 text-sm">
            <div className="flex">
              <svg className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">{apiStatusMessage}</p>
                {/* Show different explanation based on data source */}
                {apiStatusMessage?.includes('Google search') ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Results are from Google search and will link out to job listing sites.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-amber-700">
                    The internship listings shown are example data for demonstration purposes.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Career Category Pills */}
        {careerCategories.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-2">Categories matching your profile</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(categoryJobs).map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Searching for internships that match your profile...</p>
          </div>
        )}
        
        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-red-50 text-red-800 rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-1">Unable to find internships</h3>
            <p>{error}</p>
            <Button
              className="mt-3 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleBack()}
            >
              Go Back
            </Button>
          </div>
        )}
        
        {/* Internship Listings */}
        {!isLoading && !error && selectedCategory && categoryJobs[selectedCategory]?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">
              {selectedCategory} Internships ({categoryJobs[selectedCategory]?.length || 0})
            </h2>
            
            {categoryJobs[selectedCategory]?.map((internship) => (
              <div key={internship.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-start">
                  {internship.company_logo ? (
                    <img 
                      src={internship.company_logo} 
                      alt={`${internship.company_name} logo`} 
                      className="w-12 h-12 object-contain rounded-md mr-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-4">
                      <span className="text-blue-500 font-bold text-lg">
                        {internship.company_name?.charAt(0) || "C"}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-gray-900">{internship.title}</h3>
                      {/* Source badge - show if it's from Google search */}
                      {internship.id.toString().startsWith('google-') && (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                          </svg>
                          Google Search
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{internship.company_name}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {internship.job_type && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {internship.job_type}
                        </span>
                      )}
                      
                      {internship.candidate_required_location && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {internship.candidate_required_location}
                        </span>
                      )}
                      
                      {internship.publication_date && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          Posted: {formatDate(internship.publication_date)}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <a 
                        href={internship.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Apply Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* No results for category */}
        {!isLoading && selectedCategory && categoryJobs[selectedCategory]?.length === 0 && (
          <div className="bg-yellow-50 text-yellow-800 rounded-lg p-4">
            <h3 className="font-medium">No internships found for {selectedCategory}</h3>
            <p className="mt-1">Try selecting a different category or updating your profile with more specific interests.</p>
          </div>
        )}
      </div>
    </div>
  )
}