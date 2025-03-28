"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

// Components
import LoginScreen from "./screens/LoginScreen"
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

// Main App Component
export default function AetherApp() {
  const { toast } = useToast()
  const [currentScreen, setCurrentScreen] = useState<
    | "login"
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
  >("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [quizResults, setQuizResults] = useState<any>(null)
  const [userData, setUserData] = useState({
    name: "Richard Wang",
    bio: "Exploring new opportunities and personal growth!",
    interests: [
      { id: 1, category: "Technology", subcategories: "Web Development, AI, Mobile Apps" },
      { id: 2, category: "Travel", subcategories: "Hiking, Backpacking, Urban Exploration" },
      { id: 3, category: "Photography", subcategories: "Portrait, Landscape, Street" },
      { id: 4, category: "Cooking", subcategories: "Asian Cuisine, Baking, Grilling" },
      { id: 5, category: "Reading", subcategories: "Science Fiction, Biographies, Tech" }
    ]
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", credentials)
      return response.json()
    },
    onSuccess: (data) => {
      setCurrentScreen("home")
      setErrorMessage("")
      setUserData({...userData, name: username})
      toast({
        title: "Login successful",
        description: `Welcome back, ${username}!`,
      })
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

  // Handle login
  const handleLogin = () => {
    if (username && password) {
      loginMutation.mutate({ username, password })
    } else {
      setErrorMessage("Please enter your username and password.")
    }
  }

  // Handle navigation
  const navigateTo = (page: string, data?: any) => {
    if (page === "home" && data) {
      // If coming from quiz with results
      setQuizResults(data)
    }
    setCurrentScreen(page as any)
  }

  // Handle social login
  const handleSocialLogin = (provider: string) => {
    toast({
      title: `${provider} login`,
      description: `Logging in with ${provider}...`,
    })
    // In a real app, this would handle OAuth
    setTimeout(() => {
      setCurrentScreen("home")
      setUserData({...userData, name: "Richard Wang"})
    }, 1000)
  }

  // Handle back navigation
  const handleBack = (data?: any) => {
    if (data) {
      navigateTo("home", data)
    } else {
      navigateTo("home")
    }
  }

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
          ) : currentScreen === "home" ? (
            <HomeScreen username={userData.name} navigateTo={navigateTo} quizResults={quizResults} />
          ) : currentScreen === "quiz" ? (
            <QuizScreen handleBack={handleBack} />
          ) : currentScreen === "interests" ? (
            <InterestsScreen handleBack={handleBack} interests={userData.interests} setUserData={setUserData} />
          ) : currentScreen === "experience" ? (
            <ExperienceScreen handleBack={handleBack} />
          ) : currentScreen === "financials" ? (
            <FinancialsScreen handleBack={handleBack} />
          ) : currentScreen === "locations" ? (
            <LocationsScreen handleBack={handleBack} />
          ) : currentScreen === "profile" ? (
            <ProfileScreen handleBack={handleBack} username={userData.name} quizResults={quizResults} bio={userData.bio} />
          ) : currentScreen === "notifications" ? (
            <NotificationsScreen handleBack={handleBack} />
          ) : currentScreen === "messages" ? (
            <MessagesScreen handleBack={handleBack} />
          ) : currentScreen === "search" ? (
            <SearchScreen handleBack={handleBack} />
          ) : currentScreen === "premium" ? (
            <PremiumScreen handleBack={handleBack} />
          ) : (
            <ComingSoonScreen screen={currentScreen} handleBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  )
}
