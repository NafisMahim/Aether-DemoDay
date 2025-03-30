import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Users, PlusCircle, Briefcase, MapPin, PhoneCall, Mail, Linkedin, Check, X, Search, Clock, Filter, Info, CheckCircle2, Star, Calendar as CalendarIcon, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface NetworkingScreenProps {
  handleBack: (data?: any) => void
  quizResults: any
}

interface Connection {
  id: string
  name: string
  title: string
  company: string
  avatarUrl?: string
  lastContact?: string
  tags: string[]
  isSuggested?: boolean
}

interface Event {
  id: string
  title: string
  date: string
  location: string
  description: string
  type: "conference" | "workshop" | "meetup" | "webinar"
  url?: string
}

interface BusinessCard {
  name: string
  title: string
  company: string
  email: string
  phone?: string
  website?: string
  linkedin?: string
  avatarUrl?: string
  tagline?: string
}

export default function NetworkingScreen({ handleBack, quizResults }: NetworkingScreenProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("connections")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddCardDialog, setShowAddCardDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  
  // New card form state
  const [newCard, setNewCard] = useState<BusinessCard>({
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    tagline: "",
  })
  
  // New event form state
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    title: "",
    date: "",
    location: "",
    description: "",
    type: "meetup"
  })
  
  // Sample business cards
  const [myCards, setMyCards] = useState<BusinessCard[]>([
    {
      name: "Jordan Chen",
      title: "Product Designer",
      company: "Aether",
      email: "jordan.chen@example.com",
      phone: "+1 (555) 123-4567",
      website: "jordanchen.design",
      linkedin: "linkedin.com/in/jordanchen",
      tagline: "Creating intuitive experiences for tomorrow's challenges"
    }
  ])
  
  // Sample connections data
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "1",
      name: "Alex Morgan",
      title: "Frontend Developer",
      company: "TechSolutions",
      avatarUrl: "",
      lastContact: "2 weeks ago",
      tags: ["Technology", "Web Development"]
    },
    {
      id: "2",
      name: "Jamie Williams",
      title: "UX Designer",
      company: "DesignHub",
      avatarUrl: "",
      lastContact: "1 month ago",
      tags: ["Design", "UX Research"]
    }
  ])
  
  // Generate AI suggested connections based on quiz results
  const suggestedConnections = useMemo(() => {
    // If no quiz results, still provide suggestions but with generic tags
    const hasQuizResults = quizResults && 
      (quizResults.personalityType || quizResults.primaryType)
    
    // Based on personality type and career interests, generate relevant suggestions
    const personalityType = hasQuizResults 
      ? (quizResults.personalityType || quizResults.primaryType || "")
      : "Professional"
    
    const strengths = hasQuizResults && quizResults.strengths 
      ? quizResults.strengths 
      : ["Communication", "Leadership"]
      
    const careerInterests = hasQuizResults && quizResults.careerInterests 
      ? quizResults.careerInterests 
      : ["Technology", "Business"]
    
    // Generate titles and companies based on strengths and career interests
    const suggestions: Connection[] = [
      {
        id: "s1",
        name: "Taylor Reed",
        title: personalityType.includes("Creative") ? "Creative Director" : "Senior Developer",
        company: "InnovateX",
        avatarUrl: "",
        tags: [personalityType, ...strengths.slice(0, 1)],
        isSuggested: true
      },
      {
        id: "s2",
        name: "Morgan Kim",
        title: personalityType.includes("Analytical") ? "Data Scientist" : "Product Manager",
        company: "FutureTech",
        avatarUrl: "",
        tags: careerInterests.slice(0, 2),
        isSuggested: true
      },
      {
        id: "s3",
        name: "Riley Johnson",
        title: personalityType.includes("Practical") ? "Operations Manager" : "Marketing Strategist",
        company: "GrowthSolutions",
        avatarUrl: "",
        tags: strengths.slice(0, 2),
        isSuggested: true
      }
    ]
    
    return suggestions
  }, [quizResults])
  
  // Sample events data
  const [events, setEvents] = useState<Event[]>([
    {
      id: "e1",
      title: "Tech Innovation Summit",
      date: "2025-04-15",
      location: "San Francisco Convention Center",
      description: "Connect with industry leaders and discover cutting-edge technologies shaping the future of digital experiences.",
      type: "conference"
    },
    {
      id: "e2",
      title: "UX Design Workshop",
      date: "2025-04-22",
      location: "Virtual Event",
      description: "Hands-on workshop on designing intuitive user experiences with industry experts.",
      type: "workshop",
      url: "https://example.com/ux-workshop"
    }
  ])
  
  // Filter connections based on search query
  const filteredConnections = useMemo(() => {
    if (!searchQuery) return connections
    
    const query = searchQuery.toLowerCase()
    return connections.filter(
      connection => 
        connection.name.toLowerCase().includes(query) ||
        connection.title.toLowerCase().includes(query) ||
        connection.company.toLowerCase().includes(query) ||
        connection.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [connections, searchQuery])
  
  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events
    
    const query = searchQuery.toLowerCase()
    return events.filter(
      event => 
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query)
    )
  }, [events, searchQuery])
  
  const handleAddConnection = (connection: Connection) => {
    // Check if connection already exists
    const exists = connections.some(conn => conn.id === connection.id)
    
    if (!exists) {
      // Add to connections list (remove suggested flag)
      const newConnection = { ...connection, isSuggested: false }
      setConnections([...connections, newConnection])
      
      toast({
        title: "Connection added",
        description: `${connection.name} has been added to your network.`
      })
    }
  }
  
  const handleRemoveConnection = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id))
    
    toast({
      title: "Connection removed",
      description: "Contact has been removed from your network."
    })
  }
  
  const handleAddCard = () => {
    // Validation
    if (!newCard.name || !newCard.title || !newCard.company || !newCard.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }
    
    // Add to cards collection
    setMyCards([...myCards, newCard])
    
    // Reset form
    setNewCard({
      name: "",
      title: "",
      company: "",
      email: "",
      phone: "",
      tagline: ""
    })
    
    // Close dialog
    setShowAddCardDialog(false)
    
    toast({
      title: "Business card created",
      description: "Your new business card has been created and is ready to share."
    })
  }
  
  const handleAddEvent = () => {
    // Validation
    if (!newEvent.title || !newEvent.date || !newEvent.location || !newEvent.type) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }
    
    // Add to events collection
    const eventWithId: Event = {
      ...newEvent,
      id: `e${events.length + 1}`
    }
    
    setEvents([...events, eventWithId])
    
    // Reset form
    setNewEvent({
      title: "",
      date: "",
      location: "",
      description: "",
      type: "meetup"
    })
    
    // Close dialog
    setShowEventDialog(false)
    
    toast({
      title: "Event added",
      description: "New event has been added to your calendar."
    })
  }
  
  // Calculate how many suggested connections match current connections
  const getMatchPercentage = (connection: Connection) => {
    const existingTags = connections.flatMap(conn => conn.tags)
    const matchingTags = connection.tags.filter(tag => existingTags.includes(tag))
    return Math.min(100, Math.round((matchingTags.length / connection.tags.length) * 100))
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button className="mr-3" onClick={handleBack}>
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold">Virtual Networking</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10 w-full"
              placeholder="Search connections, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="connections" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Connections</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Events</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>My Cards</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            {/* AI Suggestions Section */}
            {suggestedConnections.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-primary">Recommended Connections</h2>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Based on your career assessment and interests
                </p>
                <div className="space-y-3">
                  {suggestedConnections.map((connection) => (
                    <Card key={connection.id} className="relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent"></div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={connection.avatarUrl} />
                              <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{connection.name}</h3>
                              <p className="text-sm text-muted-foreground">{connection.title} at {connection.company}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {connection.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs px-1">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {getMatchPercentage(connection)}% Match
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2 text-xs"
                              onClick={() => handleAddConnection(connection)}
                            >
                              <PlusCircle className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* My Connections */}
            <div>
              <h2 className="text-lg font-semibold mb-2">My Network</h2>
              {filteredConnections.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg">
                  <Users className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No connections found</p>
                  {searchQuery && (
                    <Button 
                      variant="link" 
                      className="mt-1 h-auto p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredConnections.map((connection) => (
                    <Card key={connection.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={connection.avatarUrl} />
                              <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{connection.name}</h3>
                              <p className="text-sm text-muted-foreground">{connection.title} at {connection.company}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {connection.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs px-1">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                  <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor"></path>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => setSelectedConnection(connection)}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Send message</DropdownMenuItem>
                              <DropdownMenuItem>Add note</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleRemoveConnection(connection.id)}
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {connection.lastContact && (
                          <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Last contacted: {connection.lastContact}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <Button 
                size="sm" 
                onClick={() => setShowEventDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
            
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No events found</p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    className="mt-1 h-auto p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <Card key={event.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{event.title}</CardTitle>
                      <div className="flex justify-between items-center">
                        <Badge variant={
                          event.type === "conference" ? "default" :
                          event.type === "workshop" ? "secondary" :
                          event.type === "meetup" ? "outline" : "destructive"
                        }>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-start text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {event.description}
                      </p>
                      <div className="flex justify-end space-x-2">
                        {event.url && (
                          <Button size="sm" variant="outline">
                            Register
                          </Button>
                        )}
                        <Button size="sm">Add to Calendar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Business Cards Tab */}
          <TabsContent value="cards" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">My Business Cards</h2>
              <Button 
                size="sm" 
                onClick={() => setShowAddCardDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Card
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {myCards.map((card, index) => (
                <div 
                  key={index} 
                  className="relative bg-white rounded-xl overflow-hidden shadow-lg p-5 border"
                  style={{
                    background: "linear-gradient(135deg, #fff 0%, #f8fafc 100%)"
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent"></div>
                  
                  <div className="flex items-start">
                    <div className="mr-4">
                      <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                        <AvatarImage src={card.avatarUrl} />
                        <AvatarFallback className="text-lg">{card.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl">{card.name}</h3>
                      <p className="text-gray-600 font-medium">{card.title}</p>
                      <p className="text-gray-500">{card.company}</p>
                      {card.tagline && (
                        <p className="text-sm text-gray-600 italic mt-2">{card.tagline}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{card.email}</span>
                    </div>
                    {card.phone && (
                      <div className="flex items-center text-sm">
                        <PhoneCall className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{card.phone}</span>
                      </div>
                    )}
                    {card.linkedin && (
                      <div className="flex items-center text-sm">
                        <Linkedin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{card.linkedin}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" variant="secondary">
                      Share Card
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Business Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Business Card</DialogTitle>
            <DialogDescription>
              Create a new business card to share with your network.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                value={newCard.name}
                onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title*
              </Label>
              <Input
                id="title"
                value={newCard.title}
                onChange={(e) => setNewCard({...newCard, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company*
              </Label>
              <Input
                id="company"
                value={newCard.company}
                onChange={(e) => setNewCard({...newCard, company: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email*
              </Label>
              <Input
                id="email"
                type="email"
                value={newCard.email}
                onChange={(e) => setNewCard({...newCard, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={newCard.phone}
                onChange={(e) => setNewCard({...newCard, phone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tagline" className="text-right">
                Tagline
              </Label>
              <Input
                id="tagline"
                value={newCard.tagline}
                onChange={(e) => setNewCard({...newCard, tagline: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCard}>Save Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Networking Event</DialogTitle>
            <DialogDescription>
              Add a new networking event to your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-title" className="text-right">
                Title*
              </Label>
              <Input
                id="event-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-date" className="text-right">
                Date*
              </Label>
              <Input
                id="event-date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-location" className="text-right">
                Location*
              </Label>
              <Input
                id="event-location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-type" className="text-right">
                Type*
              </Label>
              <select
                id="event-type"
                value={newEvent.type}
                onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="meetup">Meetup</option>
                <option value="webinar">Webinar</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="event-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="event-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Connection Details Dialog */}
      {selectedConnection && (
        <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connection Details</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-start space-x-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedConnection.avatarUrl} />
                  <AvatarFallback>{selectedConnection.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-bold text-xl">{selectedConnection.name}</h2>
                  <p className="text-muted-foreground">{selectedConnection.title}</p>
                  <p className="text-muted-foreground">{selectedConnection.company}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedConnection.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                
                <h3 className="font-medium text-sm mt-4">Contact History</h3>
                {selectedConnection.lastContact ? (
                  <div className="text-sm">
                    <p>Last contacted: {selectedConnection.lastContact}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No contact history available</p>
                )}
                
                <h3 className="font-medium text-sm mt-4">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      handleRemoveConnection(selectedConnection.id)
                      setSelectedConnection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}