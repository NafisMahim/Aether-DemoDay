import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import BottomNavigation from "../ui/BottomNavigation"
import CategoryButton from "../ui/CategoryButton"

interface HomeScreenProps {
  username: string
  navigateTo: (page: string) => void
  quizResults: any
}

export default function HomeScreen({ username, navigateTo, quizResults }: HomeScreenProps) {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState(3)

  // Get first letter of username for avatar
  const firstLetter = username.charAt(0)

  const handleTakeQuiz = () => {
    navigateTo("quiz")
  }

  const handlePremiumClick = () => {
    navigateTo("premium")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-5 mobile-header">
        <div className="flex items-center">
          <div className="relative w-[40px] h-[40px]">
            <img src="/assets/aether-logo.svg" alt="Aether Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold">
            Aether<span className="text-blue-500">.</span>
          </h1>
          <p className="text-xs text-gray-500">The Ultimate Personal Assistant</p>
        </div>

        <button
          className="bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg"
          onClick={handlePremiumClick}
        >
          Premium
        </button>
      </header>

      {/* User Profile */}
      <section className="px-5 mt-2">
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-md p-5 flex flex-col items-center">
          <div 
            className="w-16 h-16 bg-gray-200 rounded-xl mb-3 flex items-center justify-center text-2xl font-bold text-gray-400"
            onClick={() => navigateTo("profile")}
          >
            {firstLetter}
          </div>
          <h2 className="text-lg font-bold">{username}</h2>
          <p className="text-xs text-gray-500 italic mt-1">"Exploring new opportunities and personal growth!"</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-5 mt-6 flex flex-col items-center">
        <button
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-3 rounded-lg shadow-md mb-4 transform hover:scale-[1.02] transition-all duration-200"
          onClick={handleTakeQuiz}
        >
          Take a Quiz
        </button>

        <button
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-lg shadow-md mb-6 flex items-center justify-center transform hover:scale-[1.02] transition-all duration-200"
          onClick={() => navigateTo("search")}
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          Search
        </button>

        <div className="grid grid-cols-2 gap-4 w-full">
          <CategoryButton icon="🌟" label="Interests" onClick={() => navigateTo("interests")} />
          <CategoryButton icon="💼" label="Experience" onClick={() => navigateTo("experience")} />
          <CategoryButton icon="💰" label="Financials" onClick={() => navigateTo("financials")} />
          <CategoryButton icon="📍" label="Locations" onClick={() => navigateTo("locations")} />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentScreen="home" 
        navigateTo={navigateTo} 
        notificationCount={notifications}
      />
    </div>
  )
}
