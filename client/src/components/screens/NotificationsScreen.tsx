import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import BottomNavigation from "../ui/BottomNavigation"

interface NotificationsScreenProps {
  handleBack: () => void
}

interface Notification {
  id: number
  title: string
  message: string
  time: string
  isRead: boolean
  type: "message" | "reminder" | "update" | "alert"
}

export default function NotificationsScreen({ handleBack }: NotificationsScreenProps) {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New message",
      message: "Sarah sent you a message about the project.",
      time: "10 min ago",
      isRead: false,
      type: "message"
    },
    {
      id: 2,
      title: "Meeting reminder",
      message: "Team meeting in 30 minutes.",
      time: "25 min ago",
      isRead: false,
      type: "reminder"
    },
    {
      id: 3,
      title: "App update available",
      message: "A new version of Aether is available. Update now to get the latest features.",
      time: "1 hour ago",
      isRead: true,
      type: "update"
    },
    {
      id: 4,
      title: "Profile viewed",
      message: "Someone viewed your profile 5 times today.",
      time: "3 hours ago",
      isRead: true,
      type: "alert"
    },
    {
      id: 5,
      title: "Weekly summary",
      message: "Your productivity increased by 12% this week. Great job!",
      time: "2 days ago",
      isRead: true,
      type: "update"
    }
  ])

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? {...notification, isRead: true} : notification
    ))
    toast({
      title: "Marked as read",
      description: "Notification marked as read."
    })
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({...notification, isRead: true})))
    toast({
      title: "All marked as read",
      description: "All notifications marked as read."
    })
  }

  const handleDeleteNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id))
    toast({
      title: "Notification deleted",
      description: "The notification has been removed."
    })
  }

  const handleClearAll = () => {
    setNotifications([])
    toast({
      title: "All notifications cleared",
      description: "All notifications have been removed."
    })
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "message":
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        )
      case "reminder":
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )
      case "update":
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        )
    }
  }

  const unreadCount = notifications.filter(notification => !notification.isRead).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center">
        <button className="mr-3" onClick={handleBack}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold">Notifications</h1>
      </header>

      {/* Notifications Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        {notifications.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold">Recent Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-blue-500">{unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}</p>
                )}
              </div>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-500 border-red-200"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`bg-white rounded-xl shadow-sm p-4 ${!notification.isRead ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="rounded-full p-2 bg-gray-100 mr-3">
                        {getIconForType(notification.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {!notification.isRead && (
                        <button 
                          className="text-blue-500 p-1"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </button>
                      )}
                      <button 
                        className="text-gray-400 p-1"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-500 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen="notifications" navigateTo={() => handleBack()} notificationCount={unreadCount} />
    </div>
  )
}
