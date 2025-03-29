import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Interest {
  id: number
  category: string
  subcategories: string
}

interface InterestsScreenProps {
  handleBack: () => void
  interests: Interest[]
  setUserData: React.Dispatch<React.SetStateAction<{
    name: string
    bio: string
    profileImage: string
    interests: Interest[]
  }>>
  navigateTo?: (page: string) => void
}

export default function InterestsScreen({ handleBack, interests, setUserData, navigateTo = () => {} }: InterestsScreenProps) {
  const { toast } = useToast()
  const [newInterest, setNewInterest] = useState("")
  const [userInterests, setUserInterests] = useState<Interest[]>(interests)
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  const [showQuizPrompt, setShowQuizPrompt] = useState(false)
  
  // Check if the quiz has been completed
  useEffect(() => {
    // Check for query params to see if we were redirected from another page
    const path = window.location.pathname
    const searchParams = new URLSearchParams(window.location.search)
    const fromQuiz = searchParams.get('fromQuiz') === 'true'
    
    // Check from sessionStorage if quiz was completed
    const quizCompleted = sessionStorage.getItem('quizCompleted') === 'true'
    
    setIsQuizCompleted(fromQuiz || quizCompleted)
  }, [])

  const handleAddInterest = () => {
    if (newInterest.trim() === "") {
      toast({
        title: "Interest required",
        description: "Please enter an interest to add.",
        variant: "destructive",
      })
      return
    }

    const newInterestObj: Interest = {
      id: userInterests.length + 1,
      category: newInterest,
      subcategories: "New interest"
    }

    const updatedInterests = [...userInterests, newInterestObj]
    setUserInterests(updatedInterests)
    setUserData(prev => ({
      ...prev,
      interests: updatedInterests
    }))
    setNewInterest("")

    toast({
      title: "Interest added",
      description: `"${newInterest}" has been added to your interests.`
    })
  }

  const handleEditInterest = (id: number) => {
    toast({
      title: "Edit feature",
      description: "Editing interests will be available in the next update."
    })
  }

  const handleDeleteInterest = (id: number) => {
    const updatedInterests = userInterests.filter(interest => interest.id !== id)
    setUserInterests(updatedInterests)
    setUserData(prev => ({
      ...prev,
      interests: updatedInterests
    }))

    toast({
      title: "Interest removed",
      description: "The interest has been removed from your profile."
    })
  }
  
  // Handle clicking the internship button
  const handleInternshipClick = () => {
    // Check if quiz is completed
    if (!isQuizCompleted) {
      // Show prompt dialog
      setShowQuizPrompt(true)
    } else {
      // Navigate to internships page
      navigateTo("internships")
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
        <h1 className="text-xl font-bold">My Interests</h1>
      </header>

      {/* Interests Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-3">Top Categories</h2>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Technology</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Travel</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Photography</span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Cooking</span>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Reading</span>
          </div>
        </div>
        
        {/* Career Opportunities Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Career Opportunities</h2>
          <Button
            onClick={handleInternshipClick}
            className="w-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            Find Internships
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Discover opportunities matching your interests and skills
          </p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Add New Interests</h2>
          <div className="flex items-center">
            <Input 
              type="text" 
              placeholder="Type an interest..." 
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddInterest()
                }
              }}
            />
            <Button 
              className="ml-2 bg-blue-500 text-white p-2 rounded-lg"
              onClick={handleAddInterest}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {userInterests.map((interest) => (
            <div key={interest.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{interest.category}</h3>
                  <p className="text-sm text-gray-500">{interest.subcategories}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-500" onClick={() => handleEditInterest(interest.id)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </button>
                  <button className="text-red-500" onClick={() => handleDeleteInterest(interest.id)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quiz Prompt Dialog */}
      <Dialog open={showQuizPrompt} onOpenChange={setShowQuizPrompt}>
        <DialogContent className="p-0 overflow-hidden rounded-xl max-w-sm">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Insights Needed</h3>
            </div>
            <p className="text-white/90 text-sm">
              Complete your career assessment to unlock personalized internship recommendations.
            </p>
          </div>
          
          <div className="p-5 bg-gradient-to-b from-white to-blue-50">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Career Quiz Unlocks:</p>
                <p className="text-xs text-gray-600">Matched internships based on your profile</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-full hover:bg-gray-50"
                onClick={() => setShowQuizPrompt(false)}
              >
                Later
              </Button>
              <Button 
                size="sm"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md hover:from-blue-600 hover:to-blue-700"
                onClick={() => {
                  setShowQuizPrompt(false)
                  navigateTo("quiz")
                }}
              >
                Take Quiz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
