import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import BottomNavigation from "../ui/BottomNavigation"

interface MessagesScreenProps {
  handleBack: () => void
}

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  isRead: boolean
  avatar?: string
}

interface Conversation {
  id: number
  user: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
}

export default function MessagesScreen({ handleBack }: MessagesScreenProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      user: "Sarah Johnson",
      lastMessage: "Hey, did you get a chance to review the project proposal?",
      timestamp: "10:32 AM",
      unreadCount: 2
    },
    {
      id: 2,
      user: "Team Aether",
      lastMessage: "Welcome to Aether! We're glad to have you here.",
      timestamp: "Yesterday",
      unreadCount: 0
    },
    {
      id: 3,
      user: "Michael Chen",
      lastMessage: "The meeting went well. Let's catch up tomorrow.",
      timestamp: "Yesterday",
      unreadCount: 0
    },
    {
      id: 4,
      user: "Amanda Reed",
      lastMessage: "Thanks for the recommendation!",
      timestamp: "Mon",
      unreadCount: 0
    },
    {
      id: 5,
      user: "Robert Wilson",
      lastMessage: "Let me know when you're free to discuss the project timeline.",
      timestamp: "Sun",
      unreadCount: 0
    }
  ])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Record<number, Message[]>>({
    1: [
      {
        id: 1,
        sender: "Sarah Johnson",
        content: "Hi there! How's the project coming along?",
        timestamp: "10:30 AM",
        isRead: true
      },
      {
        id: 2,
        sender: "Sarah Johnson",
        content: "Hey, did you get a chance to review the project proposal?",
        timestamp: "10:32 AM",
        isRead: false
      }
    ],
    2: [
      {
        id: 1,
        sender: "Team Aether",
        content: "Welcome to Aether! We're glad to have you here.",
        timestamp: "Yesterday",
        isRead: true
      }
    ],
    3: [
      {
        id: 1,
        sender: "Michael Chen",
        content: "Are you available for a quick meeting today?",
        timestamp: "Yesterday",
        isRead: true
      },
      {
        id: 2,
        sender: "You",
        content: "Yes, I'm free after 3 PM.",
        timestamp: "Yesterday",
        isRead: true
      },
      {
        id: 3,
        sender: "Michael Chen",
        content: "Perfect! Let's meet at 3:30 PM.",
        timestamp: "Yesterday",
        isRead: true
      },
      {
        id: 4,
        sender: "Michael Chen",
        content: "The meeting went well. Let's catch up tomorrow.",
        timestamp: "Yesterday",
        isRead: true
      }
    ]
  })
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      const updatedConversations = conversations.map(conv => 
        conv.id === conversation.id ? {...conv, unreadCount: 0} : conv
      )
      setConversations(updatedConversations)
      
      // Update messages read status
      if (messages[conversation.id]) {
        const updatedMessages = {...messages}
        updatedMessages[conversation.id] = updatedMessages[conversation.id].map(msg => ({...msg, isRead: true}))
        setMessages(updatedMessages)
      }
    }
  }

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return

    const newMsg: Message = {
      id: messages[selectedConversation.id] ? Math.max(...messages[selectedConversation.id].map(m => m.id)) + 1 : 1,
      sender: "You",
      content: newMessage,
      timestamp: "Just now",
      isRead: true
    }

    // Add message to conversation
    const updatedMessages = {...messages}
    if (!updatedMessages[selectedConversation.id]) {
      updatedMessages[selectedConversation.id] = []
    }
    updatedMessages[selectedConversation.id] = [...updatedMessages[selectedConversation.id], newMsg]
    setMessages(updatedMessages)

    // Update conversation last message
    const updatedConversations = conversations.map(conv => 
      conv.id === selectedConversation.id 
        ? {...conv, lastMessage: newMessage, timestamp: "Just now"} 
        : conv
    )
    setConversations(updatedConversations)

    setNewMessage("")

    // Simulate a reply after a delay
    setTimeout(() => {
      const replyMsg: Message = {
        id: updatedMessages[selectedConversation.id] ? Math.max(...updatedMessages[selectedConversation.id].map(m => m.id)) + 1 : 1,
        sender: selectedConversation.user,
        content: "Thanks for your message! I'll get back to you soon.",
        timestamp: "Just now",
        isRead: true
      }

      const updatedMessagesWithReply = {...updatedMessages}
      updatedMessagesWithReply[selectedConversation.id] = [...updatedMessagesWithReply[selectedConversation.id], replyMsg]
      setMessages(updatedMessagesWithReply)

      // Update conversation last message again
      const updatedConversationsWithReply = updatedConversations.map(conv => 
        conv.id === selectedConversation.id 
          ? {...conv, lastMessage: "Thanks for your message! I'll get back to you soon.", timestamp: "Just now"} 
          : conv
      )
      setConversations(updatedConversationsWithReply)

      toast({
        title: "New message",
        description: `${selectedConversation.user} has replied to your message.`
      })
    }, 2000)
  }

  const handleDeleteConversation = (id: number) => {
    setConversations(conversations.filter(conversation => conversation.id !== id))
    
    if (selectedConversation && selectedConversation.id === id) {
      setSelectedConversation(null)
    }

    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed."
    })
  }

  const filteredConversations = conversations.filter(conversation => 
    conversation.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`
    }
    return name[0]
  }

  // Calculate total unread count for BottomNavigation
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center">
        {selectedConversation ? (
          <>
            <button className="mr-3" onClick={() => setSelectedConversation(null)}>
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm font-medium text-blue-600">
                {getInitials(selectedConversation.user)}
              </div>
              <h1 className="text-xl font-bold">{selectedConversation.user}</h1>
            </div>
          </>
        ) : (
          <>
            <button className="mr-3" onClick={handleBack}>
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1 className="text-xl font-bold">Messages</h1>
          </>
        )}
      </header>

      {/* Messages Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedConversation ? (
          <div className="px-5 py-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            {filteredConversations.length > 0 ? (
              <div className="space-y-3">
                {filteredConversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className={`flex items-center p-3 rounded-xl cursor-pointer hover:bg-gray-50 ${conversation.unreadCount > 0 ? 'bg-blue-50' : 'bg-white'}`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {getInitials(conversation.user)}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{conversation.user}</h3>
                        <p className="text-xs text-gray-500">{conversation.timestamp}</p>
                      </div>
                      <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <button 
                      className="ml-2 text-gray-400 p-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conversation.id)
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-center">
                  {searchQuery ? "No conversations match your search." : "No conversations yet."}
                </p>
                <Button
                  className="mt-4 bg-blue-500"
                  onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "New message functionality will be available in the next update."
                    })
                  }}
                >
                  Start New Conversation
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages[selectedConversation.id]?.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-xl p-3 ${
                      message.sender === "You" 
                        ? "bg-blue-500 text-white rounded-tr-none" 
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender === "You" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3">
              <div className="flex items-center">
                <Input
                  placeholder="Type a message..."
                  className="flex-1 rounded-full"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage()
                    }
                  }}
                />
                <Button 
                  className="ml-2 rounded-full p-2 h-10 w-10 bg-blue-500 flex items-center justify-center"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {!selectedConversation && (
        <BottomNavigation currentScreen="messages" navigateTo={() => handleBack()} notificationCount={totalUnreadCount} />
      )}
    </div>
  )
}
