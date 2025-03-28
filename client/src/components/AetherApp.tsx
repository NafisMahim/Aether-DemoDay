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
          setCurrentScreen("home")
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
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user)
        setCurrentScreen("home")
        setErrorMessage("")
        setUserData({
          ...userData, 
          name: data.user.displayName || data.user.username,
          profileImage: data.user.profileImage || ""
        })
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
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user)
        setCurrentScreen("home")
        setErrorMessage("")
        setUserData({
          ...userData,
          name: data.user.displayName || data.user.username,
          profileImage: data.user.profileImage || ""
        })
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
    if (page === "home" && data) {
      // If coming from quiz with results
      setQuizResults(data)
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
      
      setUser(null)
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
              quizResults={{...quizResults, bio: userData.bio}} 
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
                // Also update quizResults
                if (quizResults) {
                  setQuizResults({
                    ...quizResults,
                    bio: newBio,
                    profileImage: userData.profileImage // Preserve profile image
                  })
                } else {
                  setQuizResults({ 
                    bio: newBio,
                    profileImage: userData.profileImage // Preserve profile image
                  })
                }
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
                    if (quizResults) {
                      setQuizResults({
                        ...quizResults,
                        bio: updatedData.bio,
                        profileImage: updatedData.profileImage || userData.profileImage
                      })
                    } else {
                      setQuizResults({ 
                        bio: updatedData.bio,
                        profileImage: updatedData.profileImage || userData.profileImage
                      })
                    }
                    
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
                  
                  if (quizResults) {
                    setQuizResults({
                      ...quizResults,
                      bio: updatedData.bio,
                      profileImage: updatedData.profileImage || userData.profileImage
                    })
                  } else {
                    setQuizResults({ 
                      bio: updatedData.bio,
                      profileImage: updatedData.profileImage || userData.profileImage
                    })
                  }
                  
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
          ) : (
            <ComingSoonScreen screen={currentScreen} handleBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  )
}
