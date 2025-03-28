import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import BottomNavigation from "../ui/BottomNavigation"

interface SearchScreenProps {
  handleBack: () => void
}

interface SearchResult {
  id: number
  title: string
  description: string
  category: string
}

export default function SearchScreen({ handleBack }: SearchScreenProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>(["productivity apps", "career advice", "remote jobs", "personal development"])

  const mockResults: SearchResult[] = [
    {
      id: 1,
      title: "Top 10 Productivity Apps for 2023",
      description: "Discover the best apps to boost your productivity this year.",
      category: "Technology"
    },
    {
      id: 2,
      title: "How to Advance Your Career in Tech",
      description: "Expert advice on moving up the ladder in the technology industry.",
      category: "Career"
    },
    {
      id: 3,
      title: "Best Remote Work Opportunities",
      description: "Find the best remote positions available right now.",
      category: "Jobs"
    },
    {
      id: 4,
      title: "Personal Development Strategies",
      description: "Proven techniques to improve yourself professionally and personally.",
      category: "Self-Improvement"
    },
    {
      id: 5,
      title: "Financial Planning for Professionals",
      description: "How to manage your finances effectively as a working professional.",
      category: "Finance"
    }
  ]

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a search term.",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    
    // Simulate search delay
    setTimeout(() => {
      const filtered = mockResults.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      setSearchResults(filtered)
      
      // Add to recent searches if not already present
      if (!recentSearches.includes(searchQuery) && searchQuery.trim()) {
        setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)])
      }
      
      setIsSearching(false)
    }, 800)
  }

  const handleRecentSearch = (term: string) => {
    setSearchQuery(term)
    // Trigger search with a slight delay to allow state update
    setTimeout(() => {
      handleSearch()
    }, 100)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
  }

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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
        <h1 className="text-xl font-bold">Search</h1>
      </header>

      {/* Search Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div className="flex items-center mb-6">
          <Input
            type="text"
            placeholder="Search for anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button 
              className="ml-2 text-gray-500"
              onClick={handleClearSearch}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
          <Button 
            className="ml-2 bg-blue-500 text-white p-2 rounded-lg"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            )}
          </Button>
        </div>

        {/* Recent Searches */}
        {!searchResults.length && !isSearching && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Recent Searches</h2>
            <div className="space-y-2">
              {recentSearches.map((term, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-white rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRecentSearch(term)}
                >
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{term}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold mb-3">Search Results</h2>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium">{result.title}</h3>
                        <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded-full">{result.category}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{result.description}</p>
                    </div>
                    <button className="text-blue-500 ml-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs bg-blue-50 text-blue-500 border-blue-200"
                      onClick={() => {
                        toast({
                          title: "View details",
                          description: `Viewing details for "${result.title}"`
                        })
                      }}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Saved",
                          description: `"${result.title}" saved to your bookmarks`
                        })
                      }}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Sharing content",
                          description: `Sharing "${result.title}"`
                        })
                      }}
                    >
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery && (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found for "{searchQuery}"</p>
            <p className="text-sm text-gray-400 mt-1">Try different keywords or check your spelling</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen="search" navigateTo={(screen) => handleBack()} notificationCount={0} />
    </div>
  )
}
