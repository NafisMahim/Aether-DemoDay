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
        
        // Process the results
        const allInternships: Internship[] = []
        const internshipsByCategory: Record<string, Internship[]> = {}
        
        // Process Remotive results
        if (data.results.remotive && Array.isArray(data.results.remotive)) {
          data.results.remotive.forEach((result: any) => {
            const categoryName = result.query
            const categoryJobs = result.jobs || []
            
            if (!internshipsByCategory[categoryName]) {
              internshipsByCategory[categoryName] = []
            }
            
            internshipsByCategory[categoryName] = [
              ...internshipsByCategory[categoryName],
              ...categoryJobs
            ]
            
            allInternships.push(...categoryJobs)
          })
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
                    <h3 className="font-bold text-gray-900">{internship.title}</h3>
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