import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Search, BriefcaseBusiness, Sparkles } from "lucide-react"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { matchQuizResultsToCategories, getJobSearchTerms } from "../../utils/careerMappings"
import { Input } from "@/components/ui/input"

interface InternshipsScreenProps {
  handleBack: (data?: any) => void
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
  matchScore?: number
}

export default function InternshipsScreen({ handleBack, quizResults: initialQuizResults, interests }: InternshipsScreenProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [internships, setInternships] = useState<Internship[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [careerCategories, setCareerCategories] = useState<string[]>([])
  const [categoryJobs, setCategoryJobs] = useState<Record<string, Internship[]>>({})
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(initialQuizResults)
  const [isAIMatching, setIsAIMatching] = useState(false)

  // Try to load quiz results from multiple sources if they're not provided via props
  useEffect(() => {
    const loadQuizResultsFromAllSources = async () => {
      // Skip if we already have quiz results
      if (quizResults && Object.keys(quizResults).length > 0) {
        console.log('Already have quiz results in InternshipsScreen, no need to load:', Object.keys(quizResults));
        return;
      }
      
      console.log('No quiz results available in InternshipsScreen, trying to load from all sources');
      
      // Try to load from multiple sources in order of preference
      let loadedResults = null;
      
      // 1. Try sessionStorage first (most immediate)
      try {
        const sessionData = sessionStorage.getItem('quizResults');
        if (sessionData) {
          loadedResults = JSON.parse(sessionData);
          console.log('📋 Retrieved quiz results from sessionStorage in InternshipsScreen:', Object.keys(loadedResults));
        }
      } catch (error) {
        console.error('Error loading quiz results from sessionStorage in InternshipsScreen:', error);
      }
      
      // 2. Try localStorage if sessionStorage failed
      if (!loadedResults) {
        try {
          const localData = localStorage.getItem('quizResults');
          if (localData) {
            loadedResults = JSON.parse(localData);
            console.log('📋 Retrieved quiz results from localStorage in InternshipsScreen:', Object.keys(loadedResults));
          }
        } catch (error) {
          console.error('Error loading quiz results from localStorage in InternshipsScreen:', error);
        }
      }
      
      // 3. Try server as last resort
      if (!loadedResults) {
        try {
          const response = await fetch('/api/quiz/results', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.results) {
              loadedResults = data.results;
              console.log('📋 Retrieved quiz results from server in InternshipsScreen:', Object.keys(loadedResults));
              
              // Save to local storage for future use
              localStorage.setItem('quizResults', JSON.stringify(loadedResults));
              sessionStorage.setItem('quizResults', JSON.stringify(loadedResults));
            }
          }
        } catch (error) {
          console.error('Error fetching quiz results from server in InternshipsScreen:', error);
        }
      }
      
      // Set the quiz results if we found them
      if (loadedResults) {
        setQuizResults(loadedResults);
        
        // Make sure all storage methods have the latest data
        try {
          localStorage.setItem('quizResults', JSON.stringify(loadedResults));
          sessionStorage.setItem('quizResults', JSON.stringify(loadedResults));
          
          // Also try to save to server in the background for persistence across devices
          apiRequest('POST', '/api/quiz/results', loadedResults)
            .then(response => {
              if (response.ok) {
                console.log("Successfully synced quiz results to server from InternshipsScreen");
              }
            })
            .catch(error => {
              console.error("Failed to sync quiz results to server from InternshipsScreen:", error);
            });
        } catch (error) {
          console.error('Error saving loaded quiz results to storage in InternshipsScreen:', error);
        }
      } else {
        console.error('Failed to load quiz results from any source in InternshipsScreen');
        setError("Please complete your career assessment first.");
      }
    };
    
    loadQuizResultsFromAllSources();
  }, [quizResults]);
  
  // Search for internships based on quiz results and interests
  useEffect(() => {
    const searchForInternships = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // First, verify that we have actual quiz results with meaningful data
        if (!quizResults || Object.keys(quizResults).length === 0) {
          setError("Please complete the career assessment quiz before searching for internships.")
          setIsLoading(false)
          return
        }
        
        // Log the quiz results for debugging
        console.log("Quiz results for initial search:", quizResults);
        
        // Check if we have real quiz data by looking for core components
        const hasRealQuizData = (
          (quizResults.primaryType && (
            typeof quizResults.primaryType === 'object' || 
            typeof quizResults.primaryType === 'string'
          )) ||
          (quizResults.categories && Array.isArray(quizResults.categories) && quizResults.categories.length > 0) ||
          (quizResults.chartData && Array.isArray(quizResults.chartData) && quizResults.chartData.length > 0)
        );
        
        if (!hasRealQuizData) {
          setError("Your career assessment data is incomplete. Please retake the quiz for better internship matches.")
          setIsLoading(false)
          return
        }
        
        // Check for primaryType or dominantType before proceeding
        let primaryType = "";
        if (quizResults.primaryType) {
          if (typeof quizResults.primaryType === 'object' && quizResults.primaryType !== null) {
            primaryType = quizResults.primaryType.name || '';
          } else if (typeof quizResults.primaryType === 'string') {
            primaryType = quizResults.primaryType;
          }
        } else if (quizResults.dominantType) {
          primaryType = quizResults.dominantType;
        } else if (quizResults.chartData && Array.isArray(quizResults.chartData)) {
          const highestCategory = quizResults.chartData.reduce(
            (highest: any, current: any) => 
              (current.value > highest.value) ? current : highest, 
            { value: 0 }
          );
          
          if (highestCategory && highestCategory.name) {
            primaryType = highestCategory.name;
          }
        } else if (quizResults.categories && Array.isArray(quizResults.categories)) {
          const highestCategory = quizResults.categories.reduce(
            (highest: any, current: any) => 
              (current.score > highest.score) ? current : highest, 
            { score: 0 }
          );
          
          if (highestCategory && highestCategory.name) {
            primaryType = highestCategory.name;
          }
        }
        
        // Match career categories based on quiz results and interests
        const matchedCategories = matchQuizResultsToCategories({
          ...quizResults,
          primaryType: primaryType || undefined,
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
        
        // Process RapidAPI results (primary source)
        if (data.results.rapidapi && Array.isArray(data.results.rapidapi)) {
          console.log("Processing RapidAPI results:", data.results.rapidapi);
          data.results.rapidapi.forEach((result: any) => {
            if (!result || !result.query) {
              console.warn("Invalid RapidAPI result object:", result);
              return;
            }
            
            const categoryName = result.query;
            const categoryJobs = result.jobs || [];
            
            console.log(`Processing RapidAPI category ${categoryName} with ${categoryJobs.length} jobs`);
            
            if (!internshipsByCategory[categoryName]) {
              internshipsByCategory[categoryName] = [];
            }
            
            internshipsByCategory[categoryName] = [
              ...internshipsByCategory[categoryName],
              ...categoryJobs
            ];
            
            allInternships.push(...categoryJobs);
          });
        }
        
        // Process Adzuna results (secondary source)
        if (data.results.adzuna && Array.isArray(data.results.adzuna)) {
          console.log("Processing Adzuna results:", data.results.adzuna);
          data.results.adzuna.forEach((result: any) => {
            if (!result || !result.query) {
              console.warn("Invalid Adzuna result object:", result);
              return;
            }
            
            const categoryName = result.query;
            const categoryJobs = result.jobs || [];
            
            console.log(`Processing Adzuna category ${categoryName} with ${categoryJobs.length} jobs`);
            
            if (!internshipsByCategory[categoryName]) {
              internshipsByCategory[categoryName] = [];
            }
            
            internshipsByCategory[categoryName] = [
              ...internshipsByCategory[categoryName],
              ...categoryJobs
            ];
            
            allInternships.push(...categoryJobs);
          });
        }
        
        // Process Remotive results (fallback)
        if (data.results.remotive && Array.isArray(data.results.remotive)) {
          console.log("Processing Remotive results:", data.results.remotive);
          
          // Only show fallback message if we're using Remotive as the primary source
          if (data.apiStatus?.primarySource === 'remotive') {
            setApiStatusMessage('The primary internship API is currently not returning results. Showing Remotive API results instead.');
          }
          
          data.results.remotive.forEach((result: any) => {
            if (!result || !result.query) {
              console.warn("Invalid Remotive result object:", result);
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
          console.warn("No Remotive results found in API response:", data.results);
        }
        
        // Process Google search results if available (second fallback)
        if (data.results.google && Array.isArray(data.results.google)) {
          console.log("Processing Google search results:", data.results.google);
          
          // Update API status message to inform user we're using Google search
          if (data.apiStatus?.primarySource === 'google') {
            setApiStatusMessage('The primary internship APIs are currently not returning results. Showing Google search results as an alternative.');
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
        }
        
        // Log the complete data after processing
        console.log("Final internships data:", {
          categories: Object.keys(internshipsByCategory),
          totalJobs: allInternships.length,
          rapidApiJobs: allInternships.filter(job => job.id.toString().startsWith('rapidapi-')).length,
          adzunaJobs: allInternships.filter(job => job.id.toString().startsWith('adzuna-')).length,
          remotiveJobs: allInternships.filter(job => 
            !job.id.toString().startsWith('rapidapi-') && 
            !job.id.toString().startsWith('adzuna-') && 
            !job.id.toString().startsWith('google-') && 
            !job.id.toString().startsWith('mock-')
          ).length,
          googleJobs: allInternships.filter(job => job.id.toString().startsWith('google-')).length,
          mockJobs: allInternships.filter(job => job.id.toString().startsWith('mock-')).length
        });
        
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
  
  // Handle search button click to search for internships
  const handleSearchInternships = async () => {
    if (searchQuery.trim().length < 2) return;
    
    try {
      setIsSearching(true);
      setError(null);
      
      // Call the API to search for internships by keyword
      const response = await apiRequest('POST', '/api/internships/search', {
        searchQuery: searchQuery.trim(),
        limit: 20
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to search for internships");
      }
      
      // Process the results
      const allInternships: Internship[] = [];
      const internshipsByCategory: Record<string, Internship[]> = {};
      
      // Add "Search Results" as a special category
      const searchResultsCategory = `Results for "${searchQuery}"`;
      internshipsByCategory[searchResultsCategory] = [];
      
      // Process results from all sources (RapidAPI, Remotive, Google)
      Object.entries(data.results).forEach(([source, results]: [string, any]) => {
        if (Array.isArray(results)) {
          results.forEach((result: any) => {
            if (result.jobs && Array.isArray(result.jobs)) {
              // Add all jobs to the search results category
              internshipsByCategory[searchResultsCategory].push(...result.jobs);
              allInternships.push(...result.jobs);
              
              // Also organize by their original categories
              const categoryName = result.query;
              if (categoryName) {
                if (!internshipsByCategory[categoryName]) {
                  internshipsByCategory[categoryName] = [];
                }
                internshipsByCategory[categoryName].push(...result.jobs);
              }
            }
          });
        }
      });
      
      // Update state with search results
      setCategoryJobs(internshipsByCategory);
      setInternships(allInternships);
      
      // Select the search results category
      setSelectedCategory(searchResultsCategory);
      
      // Handle API status message if present
      if (data.message) {
        setApiStatusMessage(data.message);
      }
      
      if (allInternships.length === 0) {
        setError(`No internships found matching "${searchQuery}". Try different keywords.`);
      }
      
      toast({
        title: "Search Complete",
        description: `Found ${allInternships.length} internships matching "${searchQuery}"`,
        variant: allInternships.length > 0 ? "default" : "destructive"
      });
    } catch (err) {
      console.error("Error searching for internships:", err);
      setError("Failed to search for internships. Please try again later.");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle AI match button click with Gemini AI
  const handleAIMatch = async () => {
    try {
      setIsAIMatching(true);
      setError(null);
      
      // Check if quiz results are available and properly structured
      if (!quizResults || Object.keys(quizResults).length === 0) {
        // Try one last attempt to recover quiz results from any source
        let recoveredResults = null;
        
        // First try sessionStorage
        try {
          const sessionData = sessionStorage.getItem('quizResults');
          if (sessionData) {
            recoveredResults = JSON.parse(sessionData);
            console.log('Emergency recovery of quiz results from sessionStorage for AI matching:', Object.keys(recoveredResults));
            setQuizResults(recoveredResults);
          }
        } catch (error) {
          console.error('Error in emergency recovery from sessionStorage:', error);
        }
        
        // Then try localStorage if session storage failed
        if (!recoveredResults) {
          try {
            const localData = localStorage.getItem('quizResults');
            if (localData) {
              recoveredResults = JSON.parse(localData);
              console.log('Emergency recovery of quiz results from localStorage for AI matching:', Object.keys(recoveredResults));
              setQuizResults(recoveredResults);
            }
          } catch (error) {
            console.error('Error in emergency recovery from localStorage:', error);
          }
        }
        
        // If still no results, prompt the user
        if (!recoveredResults) {
          toast({
            title: "Career Quiz Required",
            description: "Please complete the career assessment quiz first to get personalized matches.",
            variant: "destructive"
          });
          setIsAIMatching(false);
          return;
        }
      }
      
      // Check if we have real quiz data with meaningful content
      const hasRealQuizData = (
        (quizResults.primaryType && (
          typeof quizResults.primaryType === 'object' || 
          typeof quizResults.primaryType === 'string'
        )) ||
        (quizResults.categories && Array.isArray(quizResults.categories) && quizResults.categories.length > 0) ||
        (quizResults.chartData && Array.isArray(quizResults.chartData) && quizResults.chartData.length > 0)
      );
      
      if (!hasRealQuizData) {
        toast({
          title: "Invalid Quiz Data",
          description: "Your quiz data appears to be incomplete. Please retake the career assessment quiz.",
          variant: "destructive"
        });
        setIsAIMatching(false);
        return;
      }
      
      // Extract primary personality type from quiz results using all possible structures
      // First, log the quiz results so we can see the shape of the data
      console.log("Quiz results for AI matching:", quizResults);
      
      let primaryType = "";
      
      // Handle different ways the primary type might be stored
      if (quizResults.primaryType) {
        // Check if primaryType is an object with a name property
        if (typeof quizResults.primaryType === 'object' && quizResults.primaryType !== null) {
          primaryType = quizResults.primaryType.name || '';
          console.log("Found primaryType as object with name:", primaryType);
        } else if (typeof quizResults.primaryType === 'string') {
          // Handle primaryType as a string
          primaryType = quizResults.primaryType;
          console.log("Found primaryType as string:", primaryType);
        }
      } else if (quizResults.dominantType) {
        // Alternative field name
        primaryType = quizResults.dominantType;
        console.log("Found dominantType:", primaryType);
      } else if (quizResults.chartData && Array.isArray(quizResults.chartData)) {
        // Try to extract from chart data (highest value)
        const highestCategory = quizResults.chartData.reduce(
          (highest: any, current: any) => 
            (current.value > highest.value) ? current : highest, 
          { value: 0 }
        );
        
        if (highestCategory && highestCategory.name) {
          primaryType = highestCategory.name;
          console.log("Extracted primaryType from chartData:", primaryType);
        }
      } else if (quizResults.categories && Array.isArray(quizResults.categories)) {
        // Try extracting from categories
        const highestCategory = quizResults.categories.reduce(
          (highest: any, current: any) => 
            (current.score > highest.score) ? current : highest, 
          { score: 0 }
        );
        
        if (highestCategory && highestCategory.name) {
          primaryType = highestCategory.name;
          console.log("Extracted primaryType from categories array:", primaryType);
        }
      }
      
      // Check if we found a valid primary type
      if (!primaryType) {
        console.error("Failed to find primary type in quiz results:", quizResults);
        toast({
          title: "Incomplete Profile",
          description: "Your quiz results don't contain a primary personality type. Please retake the quiz.",
          variant: "destructive"
        });
        setIsAIMatching(false);
        return;
      }
      
      toast({
        title: "Finding Perfect Match",
        description: `Analyzing your ${primaryType} personality type and career interests with AI...`,
      });
      
      // Enhance the userProfile with more data from quizResults
      const userProfile = {
        interests: interests || [],
        personalityType: primaryType,
        categories: quizResults.categories || [],
        strengths: quizResults.strengths || [],
        hybridCareers: quizResults.hybridCareers || []
      };
      
      // Get career suggestions based on quiz results
      const matchedCategories = matchQuizResultsToCategories({
        ...quizResults,
        interests: interests
      });
      
      console.log('Matched career categories:', matchedCategories);
      
      // Extract job titles and keywords for better matching
      const { jobTitles, keywords } = getJobSearchTerms(matchedCategories);
      
      console.log('Using personalized match parameters:', { jobTitles, keywords });
      
      // Call the AI-powered match endpoint with personalized parameters
      const response = await apiRequest('POST', '/api/internships/match', {
        userProfile,
        quizResults,
        jobTitles,
        keywords,
        isPersonalizedMatch: true,
        limit: 20
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to match internships with AI");
      }
      
      // Process the results
      const allInternships: Internship[] = [];
      const internshipsByCategory: Record<string, Internship[]> = {};
      
      // Special category for personalized AI matches
      const matchCategory = "AI Recommended Matches";
      internshipsByCategory[matchCategory] = [];
      
      // Get AI analysis results
      const aiRecommendations = data.matching?.recommendations || "No specific AI recommendations found.";
      const topMatches = data.matching?.topMatches || [];
      const matchScores = data.matching?.matchScores || {};
      
      // Process internship results from all sources
      Object.entries(data.results).forEach(([source, results]: [string, any]) => {
        if (Array.isArray(results)) {
          results.forEach((result: any) => {
            if (result.jobs && Array.isArray(result.jobs)) {
              const categoryName = result.query;
              
              // Add all jobs to both categories
              const enhancedJobs = result.jobs.map((job: Internship) => {
                // Only add match score if it's calculated by the AI and not undefined
                const matchScore = matchScores[job.title];
                return {
                  ...job,
                  // Don't add a default match score if real AI matching wasn't performed
                  matchScore: matchScore !== undefined ? matchScore : undefined
                };
              });
              
              // Sort by match score if available
              const sortedJobs = enhancedJobs.sort((a: any, b: any) => {
                return (b.matchScore || 0) - (a.matchScore || 0);
              });
              
              // Add to AI matches category
              internshipsByCategory[matchCategory].push(...sortedJobs);
              allInternships.push(...sortedJobs);
              
              // Also maintain original category
              if (categoryName) {
                if (!internshipsByCategory[categoryName]) {
                  internshipsByCategory[categoryName] = [];
                }
                internshipsByCategory[categoryName].push(...sortedJobs);
              }
            }
          });
        }
      });
      
      // Update state with match results
      setCategoryJobs(internshipsByCategory);
      setInternships(allInternships);
      
      // Select the AI matches category
      setSelectedCategory(matchCategory);
      
      // Show AI recommendations in a message
      setApiStatusMessage(aiRecommendations);
      
      if (allInternships.length === 0) {
        setError("No matching internships found for your profile. Try updating your interests or quiz results.");
      }
      
      toast({
        title: "AI Match Complete",
        description: `Found ${allInternships.length} internships matching your ${primaryType} personality and interests`,
        variant: allInternships.length > 0 ? "default" : "destructive"
      });
    } catch (err) {
      console.error("Error matching internships with AI:", err);
      setError("Failed to match internships. Please try again later.");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred while analyzing with AI",
        variant: "destructive"
      });
    } finally {
      setIsAIMatching(false);
    }
  };

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
                {/* Show different explanation based on data source indicated in the apiStatusMessage */}
                {apiStatusMessage?.includes('RapidAPI') && (
                  <p className="mt-1 text-xs text-amber-700">
                    Using RapidAPI's Internships API for the most up-to-date listings.
                  </p>
                )}
                {apiStatusMessage?.includes('Remotive API') && (
                  <p className="mt-1 text-xs text-amber-700">
                    Using Remotive API as a fallback to find remote internship opportunities.
                  </p>
                )}
                {apiStatusMessage?.includes('Google search') && (
                  <p className="mt-1 text-xs text-amber-700">
                    Results are from Google search and will link out to job listing sites.
                  </p>
                )}
                {apiStatusMessage?.includes('example') && (
                  <p className="mt-1 text-xs text-amber-700">
                    The internship listings shown are example data for demonstration purposes.
                  </p>
                )}
                {!apiStatusMessage?.includes('RapidAPI') && 
                 !apiStatusMessage?.includes('Remotive API') && 
                 !apiStatusMessage?.includes('Google search') && 
                 !apiStatusMessage?.includes('example') && (
                  <p className="mt-1 text-xs text-amber-700">
                    We're using alternative sources to find internship opportunities for you.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Search & Match Tools */}
        <div className="mb-6 space-y-4">
          {/* Search Input and A1 Button */}
          <div className="flex items-center gap-2">
            <div className="relative w-1/2"> {/* Changed from flex-1 to w-1/2 */}
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search internships..."
                className="pl-9 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchInternships();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleSearchInternships}
              disabled={isSearching || searchQuery.trim().length < 2}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
            
            {/* Talk to A1 Button */}
            <Button 
              onClick={() => handleBack('chatbot')}
              className="ml-2 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white"
            >
              <div className="flex items-center justify-center w-5 h-5 bg-black rounded-full">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              Talk to A1
            </Button>
          </div>
          
          {/* AI Match Button - only enabled if user has completed the quiz */}
          <Button 
            onClick={handleAIMatch}
            disabled={isAIMatching || isLoading || !(quizResults && quizResults.primaryType && quizResults.primaryType.name)}
            className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-medium"
            title={quizResults && quizResults.primaryType && quizResults.primaryType.name ? "Find AI matches based on your quiz results" : "Complete the career quiz first to use AI matching"}
          >
            {isAIMatching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding your perfect match...
              </>
            ) : quizResults && quizResults.primaryType && quizResults.primaryType.name ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Find Your Perfect Match
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Complete Quiz First
              </>
            )}
          </Button>
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
                    <div className="flex justify-between">
                      <h3 className="font-bold text-gray-900">{internship.title}</h3>
                      {/* Source badges - show where the data comes from */}
                      {internship.id.toString().startsWith('rapidapi-') && (
                        <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55c.24-.84-.07-1.71-.85-2.09.17-1.28-1.33-2.21-2.25-1.37-.52.48-.7 1.2-.52 1.84-1.14.36-1.61 1.57-.88 2.53.65.87 2.05.87 2.7 0 .17-.21.3-.47.36-.74l2.43 2.43c-.1.29-.1.65 0 .94l-3.55 3.56c-.95-.23-1.78.45-1.93 1.38-.16.97.47 1.94 1.52 2.01 1.04.08 1.94-.7 2.01-1.74.02-.28-.03-.54-.12-.78l3.48-3.48c.2.06.43.1.66.1 1.1 0 2-.9 2-2 0-.22-.04-.43-.1-.63l3.56-3.56c.24.1.5.15.78.13 1.02-.07 1.8-.97 1.73-1.99-.07-1.02-.97-1.8-1.99-1.73-.28.02-.54.11-.78.26L16.81 8.8c-.1-.24-.23-.46-.4-.63-.33-.33-.77-.52-1.23-.52s-.9.19-1.23.52c-.18.17-.31.39-.41.63l-2.6-2.6c.1-.24.16-.5.13-.78-.07-1.02-.97-1.8-1.99-1.73-1.02.07-1.8.97-1.73 1.99.02.28.11.53.26.77L4.2 9.8c-.24-.1-.5-.16-.78-.13-1.02.07-1.8.97-1.73 1.99.07 1.02.97 1.8 1.99 1.73.28-.02.54-.11.78-.26l3.56-3.56c.09.17.22.33.36.46.33.33.77.52 1.23.52s.9-.19 1.23-.52c.15-.15.28-.3.38-.47l2.59 2.59c-.09.3-.09.63 0 .92l-3.5 3.51c-.23-.1-.49-.16-.77-.14-1.02.07-1.8.97-1.73 1.99.07 1.02.97 1.8 1.99 1.73.28-.02.54-.11.78-.26l3.56-3.56c.1.24.25.46.43.63.33.33.77.52 1.23.52s.9-.19 1.23-.52c.36-.35.59-.86.59-1.41 0-.55-.23-1.06-.59-1.41-.33-.33-.77-.52-1.23-.52s-.9.19-1.23.52c-.18.17-.32.39-.41.63l-2.6-2.6c.1-.24.15-.5.13-.78-.02-.27-.11-.52-.25-.76l3.56-3.56c.89.32 1.87-.11 2.17-1 .31-.89-.11-1.87-1-2.18z"/>
                          </svg>
                          RapidAPI
                        </span>
                      )}
                      {internship.id.toString().startsWith('adzuna-') && (
                        <span className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.5 3a2.5 2.5 0 00-2.5 2.5v13a2.5 2.5 0 005 0v-13A2.5 2.5 0 0019.5 3zm-14 0a2.5 2.5 0 00-2.5 2.5v13a2.5 2.5 0 005 0v-13A2.5 2.5 0 005.5 3z"/>
                            <path d="M12.5 8a2.5 2.5 0 00-2.5 2.5v8a2.5 2.5 0 005 0v-8A2.5 2.5 0 0012.5 8z"/>
                          </svg>
                          Adzuna
                        </span>
                      )}
                      {!internship.id.toString().startsWith('rapidapi-') && 
                       !internship.id.toString().startsWith('adzuna-') &&
                       !internship.id.toString().startsWith('google-') && 
                       !internship.id.toString().startsWith('mock-') && (
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                            <path d="M11 11h2v6h-2zm0-4h2v2h-2z"/>
                          </svg>
                          Remotive
                        </span>
                      )}
                      {internship.id.toString().startsWith('google-') && (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                          </svg>
                          Google Search
                        </span>
                      )}
                      {internship.id.toString().startsWith('mock-') && (
                        <span className="bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                          </svg>
                          Example
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
                    
                    {/* Match Score - only show for internships with an actual match score */}
                    {internship.matchScore && (
                      <div className="mt-3 flex items-center">
                        <div className="h-1.5 w-24 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="h-1.5 rounded-full" 
                            style={{ 
                              width: `${internship.matchScore}%`,
                              backgroundColor: internship.matchScore > 70 ? '#4ade80' : '#facc15'
                            }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium" style={{ 
                          color: internship.matchScore > 70 ? '#16a34a' : '#ca8a04'
                        }}>
                          {internship.matchScore}% Match
                        </span>
                      </div>
                    )}
                    
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