import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import BottomNavigation from "../ui/BottomNavigation"

interface ProfileScreenProps {
  handleBack: () => void
  username: string
  quizResults: any
  bio: string
  onLogout?: () => Promise<void>
  navigateTo?: (screen: string) => void
  onBioChange?: (newBio: string) => void
  profileImage?: string
}

export default function ProfileScreen({ 
  handleBack, 
  username, 
  quizResults: initialQuizResults, 
  bio, 
  onLogout, 
  navigateTo = () => {}, 
  onBioChange, 
  profileImage 
}: ProfileScreenProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState(bio)
  const firstLetter = username.charAt(0)
  
  // Local state for quiz results with fallbacks
  const [quizResults, setQuizResults] = useState<any>(initialQuizResults)
  
  // DO NOT try to load quiz results from storage for new accounts
  // This was causing quiz results to be incorrectly inherited between users
  // Instead, just update the edited bio when the prop changes
  useEffect(() => {
    setEditedBio(bio);
  }, [bio]);

  // Check if we have valid quiz results - need primaryType with name
  const hasCompletedQuiz = !!(quizResults && quizResults.primaryType && quizResults.primaryType.name)
  
  // Extract quiz result data only if quiz has been completed
  const personalityType = hasCompletedQuiz ? quizResults.primaryType.name : "Take a quiz to discover your type"
  const description = hasCompletedQuiz 
    ? quizResults.primaryType.description 
    : "Your personality analysis will appear here after completing a quiz."
  
  // Only define and populate strengths and weaknesses if the user has completed the quiz
  // This ensures we don't accidentally show defaults for new users
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  
  // Added extra protection by nesting all strength/weakness generation inside hasCompletedQuiz
  if (hasCompletedQuiz && quizResults && quizResults.primaryType) {
    // Only then populate the strength and weakness data
    // Add recommended careers as strengths if they exist
    if (quizResults.primaryType.careers && Array.isArray(quizResults.primaryType.careers)) {
      strengths = [
        ...strengths,
        ...quizResults.primaryType.careers.slice(0, 3).map((career: string) => `Suitable for: ${career}`)
      ];
    }
    
    // Add hybrid careers as strengths if they exist
    if (quizResults.hybridCareers && Array.isArray(quizResults.hybridCareers)) {
      strengths = [
        ...strengths,
        ...quizResults.hybridCareers.slice(0, 2).map((career: string) => `Potential path: ${career}`)
      ];
    }
    
    // Add primary type strengths if explicitly provided
    if (quizResults.strengths && Array.isArray(quizResults.strengths)) {
      strengths = [
        ...strengths,
        ...quizResults.strengths.slice(0, 3)
      ];
    }
    
    // Add secondary dimension as a developmental area
    if (quizResults.secondaryType && quizResults.secondaryType.name) {
      weaknesses = [
        ...weaknesses,
        `Develop ${quizResults.secondaryType.name} skills further`
      ];
      
      // Add some secondary careers as areas to develop
      if (quizResults.secondaryType.careers && Array.isArray(quizResults.secondaryType.careers)) {
        weaknesses = [
          ...weaknesses,
          ...quizResults.secondaryType.careers
            .slice(0, 2)
            .map((career: string) => `Consider exploring: ${career}`)
        ];
      }
    }
  }
  
  // If we have no data at all even after all checks, ensure arrays are empty
  if (!hasCompletedQuiz) {
    strengths = [];
    weaknesses = [];
  }

  const handleSaveBio = () => {
    setIsEditing(false)
    
    // Use the prop to update parent state if available
    if (onBioChange) {
      onBioChange(editedBio)
    } else {
      // Fallback to direct mutation if callback isn't provided
      // Only update quiz results if they already exist and are valid
      if (quizResults && Object.keys(quizResults).length > 0 && quizResults.primaryType) {
        quizResults.bio = editedBio
      }
      
      // Force a navigation to home and back to profile to update state
      if (navigateTo) {
        navigateTo("home")
        setTimeout(() => {
          navigateTo("profile")
        }, 50)
      }
    }
    
    toast({
      title: "Profile updated",
      description: "Your bio has been updated successfully."
    })
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
        <h1 className="text-xl font-bold">My Profile</h1>
      </header>

      {/* Profile Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <div className="flex items-center mb-4">
            {profileImage ? (
              <div className="w-16 h-16 rounded-xl mr-4 overflow-hidden">
                <img 
                  src={profileImage} 
                  alt={username} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-xl mr-4 flex items-center justify-center text-2xl font-bold text-blue-500">
                {firstLetter}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{username}</h2>
              <p className="text-sm text-gray-500">Member since 2023</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Bio</h3>
              <Button 
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
            
            {isEditing ? (
              <div>
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2 mb-2"
                />
                <Button 
                  size="sm"
                  className="text-xs bg-blue-500"
                  onClick={handleSaveBio}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-700 italic">"{editedBio}"</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">Technology</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Travel</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">Photography</span>
          </div>
        </div>

        {/* Personality Results */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <h3 className="font-bold mb-2">Personality Analysis</h3>
          
          {/* Only show personality analysis when quizResults actually exist and contain real data */}
          {quizResults && quizResults.primaryType ? (
            <>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-bold text-blue-800">{personalityType}</h4>
                <p className="text-sm text-blue-700">{description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Areas to Improve</h4>
                  <ul className="text-sm space-y-1">
                    {weaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-amber-800">No Personality Analysis Available</h4>
                <p className="text-sm text-amber-700 mb-3">
                  You haven't completed the career personality quiz yet. Take the quiz to discover your strengths, 
                  areas for improvement, and get personalized career recommendations.
                </p>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => navigateTo("quiz")}
                >
                  Take the Career Quiz
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <h3 className="font-bold p-5 border-b">Account Settings</h3>
          
          <div>
            <button 
              onClick={() => navigateTo("editProfile")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span>Edit Profile</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
            
            <button 
              onClick={() => navigateTo("privacySecurity")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span>Privacy & Security</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
            
            <button 
              onClick={() => navigateTo("notificationSettings")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <span>Notifications</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-red-500"
              onClick={async () => {
                if (onLogout) {
                  // Call the real logout function if available
                  try {
                    await onLogout();
                    toast({
                      title: "Logged out",
                      description: "You have been logged out successfully."
                    });
                  } catch (error) {
                    toast({
                      title: "Logout failed",
                      description: "There was an error logging out. Please try again.",
                      variant: "destructive"
                    });
                  }
                } else {
                  // Fallback for when no logout function is provided
                  toast({
                    title: "Logged out",
                    description: "You have been logged out successfully."
                  });
                  // In a real app, this would handle the logout process
                  setTimeout(() => {
                    handleBack();
                  }, 1000);
                }
              }}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Log Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen="profile" navigateTo={() => handleBack()} notificationCount={0} />
    </div>
  )
}