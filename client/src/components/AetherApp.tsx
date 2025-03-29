"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

// Components
import LoginScreen from "./screens/LoginScreen"
import SignupScreen from "./screens/SignupScreen"
import HomeScreen from "./screens/HomeScreen"
import QuizScreen from "./screens/QuizScreen"
import InterestsScreen from "./screens/InterestsScreen"
import ExperienceScreen from "./screens/ExperienceScreen"
import FinancialsScreen from "./screens/FinancialsScreen"
import LocationsScreen from "./screens/LocationsScreen"
import SearchScreen from "./screens/SearchScreen"
import ProfileScreen from "./screens/ProfileScreen"
import NotificationsScreen from "./screens/NotificationsScreen"
import MessagesScreen from "./screens/MessagesScreen"
import PremiumScreen from "./screens/PremiumScreen"
import ComingSoonScreen from "./screens/ComingSoonScreen"
import EditProfileScreen from "./screens/EditProfileScreen"
import PrivacySecurityScreen from "./screens/PrivacySecurityScreen"
import NotificationSettingsScreen from "./screens/NotificationSettingsScreen"
import InternshipsScreen from "./screens/InternshipsScreen"
import ChatbotScreen from "./screens/ChatbotScreen"

// Main App Component
export default function AetherApp() {
  const { toast } = useToast()
  const [currentScreen, setCurrentScreen] = useState<
    | "login"
    | "signup"
    | "home"
    | "quiz"
    | "interests"
    | "experience"
    | "financials"
    | "locations"
    | "search"
    | "profile"
    | "notifications"
    | "messages"
    | "premium"
    | "editProfile"
    | "privacySecurity"
    | "notificationSettings"
    | "internships"
    | "chatbot"
  >("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [quizResults, setQuizResults] = useState<any>(null)
  const [userData, setUserData] = useState({
    name: "Richard Wang",
    bio: "Exploring new opportunities and personal growth!",
    profileImage: "",
    interests: [
      { id: 1, category: "Technology", subcategories: "Web Development, AI, Mobile Apps" },
      { id: 2, category: "Travel", subcategories: "Hiking, Backpacking, Urban Exploration" },
      { id: 3, category: "Photography", subcategories: "Portrait, Landscape, Street" },
      { id: 4, category: "Cooking", subcategories: "Asian Cuisine, Baking, Grilling" },
      { id: 5, category: "Reading", subcategories: "Science Fiction, Biographies, Tech" }
    ]
  })

  // Auth status query
  const [user, setUser] = useState<any>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  // Load quiz results from localStorage (regardless of auth status)
  useEffect(() => {
    try {
      const localQuizData = localStorage.getItem('quizResults');
      if (localQuizData) {
        const parsedData = JSON.parse(localQuizData);
        console.log('Initial load of quiz results from localStorage:', parsedData);
        // Always set quiz results from localStorage on initial load if available
        setQuizResults(parsedData);
      }
    } catch (error) {
      console.error('Error loading quiz results from localStorage on initial load:', error);
    }
  }, []);

  // Check authentication status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()
        
        if (data.isAuthenticated && data.user) {
          setUser(data.user)
          setUserData({
            name: data.user.displayName || data.user.username,
            bio: data.user.bio || "Exploring new opportunities and personal growth!",
            profileImage: data.user.profileImage || "",
            interests: userData.interests // Keep default interests for now
          })
          
          let serverQuizResults = null;
          
          // Fetch quiz results from API if user is authenticated
          try {
            const quizResponse = await fetch('/api/quiz/results', {
              credentials: 'include'
            })
            
            if (quizResponse.ok) {
              const quizData = await quizResponse.json()
              console.log('Retrieved quiz results from server:', quizData)
              
              if (quizData.success && quizData.results) {
                // Save to server results for comparison
                serverQuizResults = quizData.results;
                
                // Set as current quiz results
                setQuizResults(quizData.results);
                
                // Always ensure the server results are also cached in localStorage
                localStorage.setItem('quizResults', JSON.stringify(quizData.results));
                console.log('Saved server quiz results to localStorage for persistence');
              }
            } else if (quizResponse.status !== 404) {
              // Don't log 404s as errors since it's normal for new users
              console.error('Error fetching quiz results:', quizResponse.status)
            }
          } catch (quizError) {
            console.error('Error fetching quiz results:', quizError)
          }
          
          // If no server results but we have localStorage data, push it to the server
          if (!serverQuizResults) {
            try {
              const localQuizData = localStorage.getItem('quizResults')
              if (localQuizData) {
                const parsedData = JSON.parse(localQuizData)
                console.log('Using localStorage quiz results since server had none:', parsedData)
                setQuizResults(parsedData)
                
                // Also save to server for future sessions
                try {
                  console.log("Syncing localStorage quiz results to server")
                  const saveResponse = await apiRequest("POST", "/api/quiz/results", parsedData)
                  const saveData = await saveResponse.json()
                  console.log("Synced localStorage quiz results to server:", saveData)
                } catch (syncError) {
                  console.error("Failed to sync localStorage quiz results to server:", syncError)
                }
              }
            } catch (localStorageError) {
              console.error('Error retrieving quiz results from localStorage:', localStorageError)
            }
          }
          
          setCurrentScreen("home")
        } else {
          // Not authenticated, ensure we still try to load from localStorage
          try {
            const localQuizData = localStorage.getItem('quizResults');
            if (localQuizData && !quizResults) { // Only set if not already set by initial load
              const parsedData = JSON.parse(localQuizData);
              console.log('Not authenticated, loading quiz results from localStorage:', parsedData);
              setQuizResults(parsedData);
            }
          } catch (error) {
            console.error('Error loading quiz results from localStorage when not authenticated:', error);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
      } finally {
        setIsAuthenticating(false)
      }
    }
    
    checkAuthStatus()
  }, [])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", credentials)
      return response.json()
    },
    onSuccess: async (data) => {
      if (data.user) {
        setUser(data.user)
        setErrorMessage("")
        
        // Update user data
        setUserData({
          ...userData, 
          name: data.user.displayName || data.user.username,
          bio: data.user.bio || userData.bio,
          profileImage: data.user.profileImage || ""
        })
        
        // Fetch quiz results if they exist
        let foundQuizResults = false;
        
        try {
          const quizResponse = await fetch('/api/quiz/results', {
            credentials: 'include'
          })
          
          if (quizResponse.ok) {
            const quizData = await quizResponse.json()
            console.log('Retrieved quiz results after login:', quizData)
            
            if (quizData.success && quizData.results) {
              setQuizResults(quizData.results)
              foundQuizResults = true;
            }
          } else if (quizResponse.status !== 404) {
            // 404 is expected for users without quiz results
            console.error('Error fetching quiz results after login:', quizResponse.status)
          }
        } catch (quizError) {
          console.error('Error fetching quiz results after login:', quizError)
        }
        
        // If quiz results weren't found from the server, check localStorage
        if (!foundQuizResults) {
          try {
            const localQuizData = localStorage.getItem('quizResults')
            if (localQuizData) {
              const parsedData = JSON.parse(localQuizData)
              console.log('Retrieved quiz results from localStorage after login:', parsedData)
              setQuizResults(parsedData)
              
              // Also save to server for future sessions
              try {
                console.log("Syncing localStorage quiz results to server after login")
                const saveResponse = await apiRequest("POST", "/api/quiz/results", parsedData)
                const saveData = await saveResponse.json()
                console.log("Synced localStorage quiz results to server after login:", saveData)
              } catch (syncError) {
                console.error("Failed to sync localStorage quiz results to server after login:", syncError)
              }
            }
          } catch (localStorageError) {
            console.error('Error retrieving quiz results from localStorage after login:', localStorageError)
          }
        }
        
        setCurrentScreen("home")
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.displayName || data.user.username}!`,
        })
      }
    },
    onError: (error) => {
      setErrorMessage("Invalid username or password. Please try again.")
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    }
  })

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/register", userData)
      return response.json()
    },
    onSuccess: async (data) => {
      if (data.user) {
        setUser(data.user)
        setErrorMessage("")
        
        // Update user data
        setUserData({
          ...userData,
          name: data.user.displayName || data.user.username,
          bio: data.user.bio || userData.bio,
          profileImage: data.user.profileImage || ""
        })
        
        let foundQuizResults = false;
        
        // For new users, there's usually no quiz results yet, but check anyway
        try {
          const quizResponse = await fetch('/api/quiz/results', {
            credentials: 'include'
          })
          
          if (quizResponse.ok) {
            const quizData = await quizResponse.json()
            console.log('Retrieved quiz results after signup:', quizData)
            
            if (quizData.success && quizData.results) {
              setQuizResults(quizData.results)
              foundQuizResults = true;
            }
          }
        } catch (quizError) {
          // Silently fail since new users won't have quiz results
          console.log('No quiz results for new user (expected)')
        }
        
        // For new signups, check if there are any quiz results in localStorage that we should associate with this new account
        if (!foundQuizResults) {
          try {
            const localQuizData = localStorage.getItem('quizResults')
            if (localQuizData) {
              const parsedData = JSON.parse(localQuizData)
              console.log('Found quiz results in localStorage for new user:', parsedData)
              setQuizResults(parsedData)
              
              // Save to server to associate with the new account
              try {
                console.log("Saving localStorage quiz results to new user account")
                const saveResponse = await apiRequest("POST", "/api/quiz/results", parsedData)
                const saveData = await saveResponse.json()
                console.log("Saved localStorage quiz results to new user account:", saveData)
              } catch (syncError) {
                console.error("Failed to save localStorage quiz results to new user account:", syncError)
              }
            }
          } catch (localStorageError) {
            console.error('Error retrieving quiz results from localStorage for new user:', localStorageError)
          }
        }
        
        setCurrentScreen("home")
        
        toast({
          title: "Account created",
          description: `Welcome to Aether, ${data.user.displayName || data.user.username}!`,
        })
      }
    },
    onError: (error: any) => {
      let errorMsg = "Registration failed. Please try again."
      if (error.message && typeof error.message === 'string') {
        errorMsg = error.message
      }
      setErrorMessage(errorMsg)
      toast({
        title: "Registration failed",
        description: errorMsg,
        variant: "destructive",
      })
    }
  })

  // Handle login
  const handleLogin = () => {
    if (username && password) {
      loginMutation.mutate({ username, password })
    } else {
      setErrorMessage("Please enter your username and password.")
    }
  }

  // Handle signup
  const handleSignup = (username: string, email: string, password: string) => {
    if (username && email && password) {
      signupMutation.mutate({ username, email, password })
    } else {
      setErrorMessage("Please fill out all required fields.")
    }
  }

  // Switch between login and signup screens
  const toggleAuthScreen = () => {
    setErrorMessage("")
    setCurrentScreen(currentScreen === "login" ? "signup" : "login")
  }

  // Handle navigation
  const navigateTo = (page: string, data?: any) => {
    // Check if data is a React event (has React-specific properties)
    const isReactEvent = data && (
      data._reactName || 
      data.nativeEvent || 
      data.target || 
      data.currentTarget ||
      data.preventDefault
    );
    
    if (isReactEvent) {
      console.log("Received React event in navigateTo, not saving as quiz results");
      // Just navigate without saving event as quiz data
      setCurrentScreen(page as any);
      return;
    }
    
    // If data is provided and it's not a React event, it contains quiz results that should be saved
    if (data) {
      // Set quiz results regardless of which page we're navigating to
      setQuizResults(data);
      
      // Always save to localStorage/sessionStorage for redundancy across all navigations
      try {
        console.log("Auto-saving quiz results during navigation to " + page);
        
        // Make a deep copy to avoid reference issues
        const dataCopy = JSON.parse(JSON.stringify(data));
        
        // Save to both storage methods for redundancy
        localStorage.setItem('quizResults', JSON.stringify(dataCopy));
        sessionStorage.setItem('quizResults', JSON.stringify(dataCopy));
        
        // Also save to server in the background for persistence between sessions
        if (user && user.id) {
          apiRequest("POST", "/api/quiz/results", dataCopy)
            .then(response => response.json())
            .then(responseData => {
              console.log("Quiz results auto-saved to server during navigation:", responseData)
            })
            .catch(error => {
              console.error("Failed to auto-save quiz results to server during navigation:", error)
            })
        }
      } catch (error) {
        console.error("Error saving quiz results during navigation:", error);
      }
    } else {
      // Even if no new data is provided, ensure we preserve current quiz results
      if (quizResults && Object.keys(quizResults).length > 0) {
        try {
          // First, verify this isn't just a React event stored in quizResults accidentally
          if (!quizResults._reactName && !quizResults.nativeEvent) {
            console.log("Preserving existing quiz results during navigation to " + page);
            localStorage.setItem('quizResults', JSON.stringify(quizResults));
            sessionStorage.setItem('quizResults', JSON.stringify(quizResults));
          } else {
            console.warn("Found React event in quizResults, not preserving");
          }
        } catch (error) {
          console.error("Error preserving quiz results during navigation:", error);
        }
      }
    }
    
    setCurrentScreen(page as any)
  }

  // Handle social login or signup navigation
  const handleSocialLogin = (provider: string) => {
    // Special case for signup link
    if (provider === "signup") {
      setCurrentScreen("signup")
      setErrorMessage("")
      return
    }
    
    toast({
      title: `${provider} login`,
      description: `Redirecting to ${provider} login...`,
    })
    
    // Redirect to the proper OAuth endpoint
    switch (provider) {
      case "Google":
        window.location.href = "/auth/google"
        break
      case "GitHub":
        window.location.href = "/auth/github"
        break
      default:
        toast({
          title: "Not implemented",
          description: `Login with ${provider} is not yet available.`,
          variant: "destructive"
        })
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await apiRequest("POST", "/api/logout")
      const data = await response.json()
      
      // Clear user state
      setUser(null)
      
      // IMPORTANT: Clear ALL quiz results from state and storage
      setQuizResults(null)
      localStorage.removeItem('quizResults')
      sessionStorage.removeItem('quizResults')
      console.log("Cleared all quiz results from localStorage and sessionStorage during logout")
      
      // Navigate back to login screen
      setCurrentScreen("login")
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle back navigation
  const handleBack = (data?: any) => {
    // Check if data is a string destination (for specific navigation targets)
    if (data && typeof data === "string") {
      console.log(`Navigating to specific destination: ${data}`);
      navigateTo(data);
      return;
    }
    
    // Check if data is a React click event (which shouldn't be saved as quiz results)
    if (data && data._reactName) {
      console.log("Received a React event instead of quiz results, ignoring for data storage");
      navigateTo("home");
      return;
    }
    
    if (data) {
      navigateTo("home", data)
    } else {
      navigateTo("home")
    }
  }

  // Check if we should show the signup screen from hash routing
  useEffect(() => {
    if (window.location.hash === '#signup') {
      setCurrentScreen('signup')
      window.location.hash = ''
    }
  }, [])
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#e3f2fd] to-[#bbdefb]">
      <div className="w-[360px] h-[740px] bg-black rounded-[40px] border-[8px] border-black shadow-xl relative overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-[15px] z-10"></div>

        {/* Inner screen */}
        <div className="w-full h-full rounded-[32px] bg-gradient-to-b from-[#f8f9fa] to-[#e3f2fd] overflow-hidden">
          {currentScreen === "login" ? (
            <LoginScreen
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              handleLogin={handleLogin}
              handleSocialLogin={handleSocialLogin}
              errorMessage={errorMessage}
              isLoading={loginMutation.isPending}
            />
          ) : currentScreen === "signup" ? (
            <SignupScreen
              onBackToLogin={toggleAuthScreen}
              onSignupSubmit={handleSignup}
              errorMessage={errorMessage}
              isLoading={signupMutation.isPending}
            />
          ) : currentScreen === "home" ? (
            <HomeScreen 
              username={userData.name} 
              navigateTo={navigateTo} 
              quizResults={quizResults && Object.keys(quizResults).length > 0 ? 
                {...quizResults, bio: userData.bio} : 
                null
              } 
              profileImage={userData.profileImage}
            />
          ) : currentScreen === "quiz" ? (
            <QuizScreen handleBack={handleBack} />
          ) : currentScreen === "interests" ? (
            <InterestsScreen 
              handleBack={handleBack} 
              interests={userData.interests} 
              setUserData={(newData) => {
                // Handle the missing profileImage field
                setUserData({
                  ...userData,
                  ...newData,
                  profileImage: userData.profileImage // Preserve the profile image
                })
              }}
              navigateTo={navigateTo}
            />
          ) : currentScreen === "experience" ? (
            <ExperienceScreen handleBack={handleBack} />
          ) : currentScreen === "financials" ? (
            <FinancialsScreen handleBack={handleBack} />
          ) : currentScreen === "locations" ? (
            <LocationsScreen handleBack={handleBack} />
          ) : currentScreen === "profile" ? (
            <ProfileScreen 
              handleBack={handleBack} 
              username={userData.name} 
              quizResults={quizResults} 
              bio={userData.bio} 
              profileImage={userData.profileImage}
              onLogout={handleLogout}
              navigateTo={navigateTo}
              onBioChange={(newBio) => {
                // Update userData when bio is changed directly in profile
                setUserData({
                  ...userData,
                  bio: newBio
                })
                // Only update quiz results if they exist
                if (quizResults && Object.keys(quizResults).length > 0 && quizResults.primaryType) {
                  // Make sure we have real quiz results before updating
                  setQuizResults({
                    ...quizResults,
                    bio: newBio,
                    profileImage: userData.profileImage // Preserve profile image
                  })
                }
                // Don't create fake quiz results if there aren't any real ones
              }}
            />
          ) : currentScreen === "notifications" ? (
            <NotificationsScreen handleBack={handleBack} />
          ) : currentScreen === "messages" ? (
            <MessagesScreen handleBack={handleBack} />
          ) : currentScreen === "search" ? (
            <SearchScreen handleBack={handleBack} />
          ) : currentScreen === "premium" ? (
            <PremiumScreen handleBack={handleBack} />
          ) : currentScreen === "editProfile" ? (
            <EditProfileScreen 
              handleBack={() => navigateTo("profile")} 
              userData={{
                name: userData.name,
                username: user?.username || "",
                email: user?.email || "",
                bio: userData.bio,
                profileImage: userData.profileImage
              }} 
              onSave={async (updatedData) => {
                // Save the data to the server
                if (user && user.id) {
                  try {
                    const response = await apiRequest("PATCH", `/api/users/${user.id}`, {
                      displayName: updatedData.name,
                      username: updatedData.username,
                      email: updatedData.email,
                      bio: updatedData.bio,
                      profileImage: updatedData.profileImage
                    })
                    
                    const data = await response.json()
                    
                    // Update local user state with server response
                    if (data.user) {
                      setUser(data.user)
                    }
                    
                    // Update client state
                    setUserData({
                      ...userData,
                      name: updatedData.name,
                      bio: updatedData.bio,
                      profileImage: updatedData.profileImage || userData.profileImage
                    })
                    
                    // Update quiz results to include bio so it shows on home screen
                    // Only if we have real quiz results
                    if (quizResults && Object.keys(quizResults).length > 0 && quizResults.primaryType) {
                      setQuizResults({
                        ...quizResults,
                        bio: updatedData.bio,
                        profileImage: updatedData.profileImage || userData.profileImage
                      })
                    }
                    // Don't create fake quiz results
                    
                    toast({
                      title: "Profile updated",
                      description: "Your profile has been updated successfully."
                    })
                  } catch (error) {
                    console.error("Error updating profile:", error)
                    toast({
                      title: "Update failed",
                      description: "There was an error updating your profile. Please try again.",
                      variant: "destructive"
                    })
                    throw error // Re-throw to be caught by EditProfileScreen's error handler
                  }
                } else {
                  // Fallback to client-side only updates if not logged in
                  setUserData({
                    ...userData,
                    name: updatedData.name,
                    bio: updatedData.bio,
                    profileImage: updatedData.profileImage || userData.profileImage
                  })
                  
                  // Only update quiz results if they already exist and are valid
                  if (quizResults && Object.keys(quizResults).length > 0 && quizResults.primaryType) {
                    setQuizResults({
                      ...quizResults,
                      bio: updatedData.bio,
                      profileImage: updatedData.profileImage || userData.profileImage
                    })
                  }
                  // Don't create fake quiz results
                  
                  toast({
                    title: "Profile updated",
                    description: "Your profile has been updated successfully."
                  })
                }
              }}
            />
          ) : currentScreen === "privacySecurity" ? (
            <PrivacySecurityScreen handleBack={() => navigateTo("profile")} />
          ) : currentScreen === "notificationSettings" ? (
            <NotificationSettingsScreen handleBack={() => navigateTo("profile")} />
          ) : currentScreen === "internships" ? (
            <InternshipsScreen 
              handleBack={handleBack} 
              quizResults={quizResults}
              interests={userData.interests}
            />
          ) : currentScreen === "chatbot" ? (
            <ChatbotScreen 
              handleBack={handleBack}
            />
          ) : (
            <ComingSoonScreen screen={currentScreen} handleBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  )
}
