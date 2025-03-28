import React from "react"

interface BottomNavigationProps {
  currentScreen: string
  navigateTo: (screen: string) => void
  notificationCount?: number
}

export default function BottomNavigation({ currentScreen, navigateTo, notificationCount = 0 }: BottomNavigationProps) {
  return (
    <footer className="mt-auto px-4 pb-6">
      <div className="w-full bg-white rounded-2xl shadow-md flex items-center justify-between p-3">
        <button 
          className={`flex flex-col items-center p-2 rounded-lg group ${currentScreen === "home" ? "text-blue-500" : "text-gray-500 hover:text-blue-500"}`}
          onClick={() => navigateTo("home")}
        >
          <svg 
            className={`w-6 h-6 ${currentScreen === "home" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`} 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
          </svg>
          <span className={`text-xs font-medium ${currentScreen === "home" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`}>Home</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 rounded-lg group ${currentScreen === "search" ? "text-blue-500" : "text-gray-500 hover:text-blue-500"}`}
          onClick={() => navigateTo("search")}
        >
          <svg 
            className={`w-6 h-6 ${currentScreen === "search" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <span className={`text-xs font-medium ${currentScreen === "search" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`}>Search</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 rounded-lg group ${currentScreen === "profile" ? "text-blue-500" : "text-gray-500 hover:text-blue-500"}`}
          onClick={() => navigateTo("profile")}
        >
          <svg 
            className={`w-6 h-6 ${currentScreen === "profile" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span className={`text-xs font-medium ${currentScreen === "profile" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`}>Profile</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 rounded-lg group relative ${currentScreen === "notifications" ? "text-blue-500" : "text-gray-500 hover:text-blue-500"}`}
          onClick={() => navigateTo("notifications")}
        >
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {notificationCount}
            </span>
          )}
          <svg 
            className={`w-6 h-6 ${currentScreen === "notifications" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <span className={`text-xs font-medium ${currentScreen === "notifications" ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`}>Alerts</span>
        </button>
      </div>
    </footer>
  )
}
