import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchNetworkingEvents, NetworkingEvent as ApiNetworkingEvent } from "@/utils/networkingService"
import { 
  FileText, Share2, Download, Clock, Search, Calendar, Users, Briefcase, 
  Plus, Edit, Trash, CheckCircle2, ExternalLink, DownloadCloud, ArrowRight,
  Building, Mail, Phone, Globe, Linkedin, User, Info 
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface NetworkingScreenProps {
  handleBack: (data?: any) => void
  quizResults: any
}

// Types for business cards
interface BusinessCard {
  id: string
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

// Types for AI networking opportunities
interface NetworkingOpportunity {
  id: string
  title: string
  type: "conference" | "community" | "program" | "mentorship" | "organization"
  description: string
  relevanceScore: number
  url?: string
  industry: string
  tags: string[]
  location?: string
  date?: string
}

// Types for resume sections
interface ResumeSection {
  id: string
  type: "experience" | "education" | "skills" | "projects" | "certifications"
  title: string
  organization?: string
  date?: string
  description: string
  bullets?: string[]
}

export default function NetworkingScreen({ handleBack, quizResults }: NetworkingScreenProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("networking")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog states
  const [showAddCardDialog, setShowAddCardDialog] = useState(false)
  const [showAddResumeDialog, setShowAddResumeDialog] = useState(false)
  const [showShareCardDialog, setShowShareCardDialog] = useState<string | null>(null)
  const [resumeSectionType, setResumeSectionType] = useState<string>("experience")
  const [selectedResumeSection, setSelectedResumeSection] = useState<ResumeSection | null>(null)
  
  // Business card state
  const [myCards, setMyCards] = useState<BusinessCard[]>([
    {
      id: "card1",
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
  
  // New business card form state
  const [newCard, setNewCard] = useState<Omit<BusinessCard, "id">>({
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    website: "",
    linkedin: "",
    tagline: ""
  })
  
  // Resume sections state
  const [resumeSections, setResumeSections] = useState<ResumeSection[]>([
    {
      id: "exp1",
      type: "experience",
      title: "UX Designer",
      organization: "Creative Solutions Inc.",
      date: "2023 - Present",
      description: "Leading design initiatives for mobile applications and web platforms.",
      bullets: [
        "Increased user engagement by 45% through redesigned onboarding flow",
        "Collaborated with cross-functional teams to implement new features",
        "Conducted user research and usability testing to inform design decisions"
      ]
    },
    {
      id: "edu1",
      type: "education",
      title: "Bachelor of Science in Computer Science",
      organization: "University of Technology",
      date: "2019 - 2023",
      description: "Graduated with honors, specializing in Human-Computer Interaction.",
      bullets: [
        "Senior thesis: AI-powered interfaces for accessibility",
        "President of Design Club",
        "Dean's List all semesters"
      ]
    },
    {
      id: "skills1",
      type: "skills",
      title: "Technical Skills",
      description: "Design and development expertise",
      bullets: [
        "UI/UX Design: Figma, Adobe XD, Sketch",
        "Programming: HTML, CSS, JavaScript, React",
        "Tools: Jira, Notion, GitHub",
        "Soft Skills: Communication, Leadership, Problem-solving"
      ]
    }
  ])
  
  // New resume section state
  const [newResumeSection, setNewResumeSection] = useState<Omit<ResumeSection, "id">>({
    type: "experience",
    title: "",
    organization: "",
    date: "",
    description: "",
    bullets: ["", "", ""]
  })
  
  // Extract career interests from quiz results for AI suggestions
  const careerProfile = useMemo(() => {
    // Extract personality type with enhanced handling of different formats
    let personalityType = "Professional"
    let careerInterests: string[] = []
    
    if (quizResults) {
      // Handle different formats of personality types
      if (quizResults.personalityType) {
        personalityType = String(quizResults.personalityType)
      } else if (quizResults.primaryType) {
        if (typeof quizResults.primaryType === 'string') {
          personalityType = quizResults.primaryType
        } else if (quizResults.primaryType && quizResults.primaryType.name) {
          personalityType = quizResults.primaryType.name
          
          // Get careers if available
          if (quizResults.primaryType.careers && Array.isArray(quizResults.primaryType.careers)) {
            careerInterests = [...careerInterests, ...quizResults.primaryType.careers]
          }
        }
      } else if (quizResults.dominantType) {
        personalityType = String(quizResults.dominantType)
      }
      
      // Extract more career interests from different quiz result formats
      if (quizResults.careerInterests) {
        if (Array.isArray(quizResults.careerInterests)) {
          careerInterests = [...careerInterests, ...quizResults.careerInterests]
        }
      }
      
      if (quizResults.hybridCareers && Array.isArray(quizResults.hybridCareers)) {
        careerInterests = [...careerInterests, ...quizResults.hybridCareers]
      }
      
      if (quizResults.strengths && Array.isArray(quizResults.strengths)) {
        careerInterests = [...careerInterests, ...quizResults.strengths]
      }
    }
    
    // Ensure some default career interests if none found
    if (careerInterests.length === 0) {
      careerInterests = ["Technology", "Design", "Business"]
    }
    
    // Deduplicate
    careerInterests = Array.from(new Set(careerInterests))
    
    return { personalityType, careerInterests }
  }, [quizResults])
  
  // Fetch networking events from the API based on quiz results
  const { 
    data: networkingData,
    isLoading: isLoadingEvents,
    error: networkingError
  } = useQuery({
    queryKey: ['/api/networking/events', careerProfile],
    queryFn: async () => {
      const { personalityType, careerInterests } = careerProfile
      return await fetchNetworkingEvents(quizResults, {
        additionalInterests: careerInterests
      })
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Convert API events to NetworkingOpportunity format
  const networkingOpportunities = useMemo(() => {
    // Default to empty array if no data or error
    if (!networkingData?.events || networkingData.events.length === 0) {
      return [
        {
          id: "net1",
          title: "Tech Innovators Meetup",
          type: "conference",
          description: "Monthly gathering of tech professionals discussing emerging technologies and industry trends.",
          url: "https://meetup.com/tech-innovators",
          relevanceScore: 92,
          industry: "Technology",
          tags: ["Technology", "Innovation", "Networking"]
        },
        {
          id: "net2",
          title: "Women in Design Community",
          type: "community",
          description: "Supportive community for women in design to share resources, mentorship, and job opportunities.",
          url: "https://discord.gg/women-in-design",
          relevanceScore: 85,
          industry: "Design",
          tags: ["Design", "Community", "Mentorship"]
        },
        {
          id: "net3",
          title: "Product Management Fellowship",
          type: "program",
          description: "Six-month fellowship connecting early-career product managers with industry mentors and resources.",
          url: "https://productfellowship.org",
          relevanceScore: 78,
          industry: "Product",
          tags: ["Product Management", "Leadership", "Career Development"]
        },
        {
          id: "net4",
          title: "Creative Industries Mentorship",
          type: "mentorship",
          description: "Structured mentorship program pairing creative professionals with industry leaders.",
          url: "https://creativementorship.org",
          relevanceScore: 89,
          industry: "Creative",
          tags: ["Creative", "Mentorship", "Career Development"],
          date: "Applications open May 1, 2025"
        },
        {
          id: "net5",
          title: "Young Leaders Network",
          type: "organization",
          description: "Organization for early-career professionals focused on leadership development and networking.",
          url: "https://youngleadersnetwork.org",
          relevanceScore: 75,
          industry: "Cross-industry",
          tags: ["Leadership", "Networking", "Professional Development"]
        }
      ]
    }

    // Convert API events to our NetworkingOpportunity format
    return networkingData.events.map(event => {
      // Map event type to appropriate NetworkingOpportunity type
      let opportunityType: NetworkingOpportunity['type'] = "conference";
      
      if (event.type === "workshop") {
        opportunityType = "program";
      } else if (event.type === "meetup" || event.type === "networking") {
        opportunityType = "community";
      } else if (event.type === "other") {
        opportunityType = "organization";
      }
      
      // Determine industry from categories or source
      let industry = event.categories && event.categories.length > 0
        ? event.categories[0]
        : event.source === "eventbrite" 
          ? "Professional" 
          : "Entertainment";
      
      return {
        id: event.id,
        title: event.title,
        type: opportunityType,
        description: event.description,
        url: event.url,
        relevanceScore: event.relevanceScore || 75,
        industry: industry,
        tags: event.categories || [],
        location: [event.venue, event.city, event.state].filter(Boolean).join(', '),
        date: event.date
      } as NetworkingOpportunity;
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [networkingData])
  
  // Filtered networking opportunities based on search
  const filteredOpportunities = useMemo(() => {
    if (!searchQuery) return networkingOpportunities
    
    const query = searchQuery.toLowerCase()
    return networkingOpportunities.filter(
      opportunity => 
        opportunity.title.toLowerCase().includes(query) ||
        opportunity.description.toLowerCase().includes(query) ||
        opportunity.industry.toLowerCase().includes(query) ||
        opportunity.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [networkingOpportunities, searchQuery])
  
  // Filtered business cards based on search
  const filteredCards = useMemo(() => {
    if (!searchQuery) return myCards
    
    const query = searchQuery.toLowerCase()
    return myCards.filter(
      card => 
        card.name.toLowerCase().includes(query) ||
        card.title.toLowerCase().includes(query) ||
        card.company.toLowerCase().includes(query) ||
        (card.tagline && card.tagline.toLowerCase().includes(query))
    )
  }, [myCards, searchQuery])
  
  // Filtered resume sections based on search and type
  const filteredResumeSections = useMemo(() => {
    const sections = searchQuery 
      ? resumeSections.filter(
          section => 
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (section.organization && section.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
            section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (section.bullets && section.bullets.some(bullet => bullet.toLowerCase().includes(searchQuery.toLowerCase())))
        )
      : resumeSections
    
    // Group by type
    const groupedSections = sections.reduce((acc, section) => {
      if (!acc[section.type]) {
        acc[section.type] = []
      }
      acc[section.type].push(section)
      return acc
    }, {} as Record<string, ResumeSection[]>)
    
    return groupedSections
  }, [resumeSections, searchQuery])
  
  // Handle adding a new business card
  const handleAddCard = () => {
    // Validation
    if (!newCard.name || !newCard.title || !newCard.company || !newCard.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields: Name, Title, Company, and Email.",
        variant: "destructive"
      })
      return
    }
    
    // Create new card with ID
    const cardWithId: BusinessCard = {
      ...newCard,
      id: `card${Date.now()}`
    }
    
    // Add to cards collection
    setMyCards([...myCards, cardWithId])
    
    // Reset form
    setNewCard({
      name: "",
      title: "",
      company: "",
      email: "",
      phone: "",
      website: "",
      linkedin: "",
      tagline: ""
    })
    
    // Close dialog
    setShowAddCardDialog(false)
    
    toast({
      title: "Business card created",
      description: "Your new business card has been created and is ready to share."
    })
  }
  
  // Handle adding a new resume section
  const handleAddResumeSection = () => {
    // Validation
    if (!newResumeSection.title || (newResumeSection.type !== 'skills' && !newResumeSection.organization)) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }
    
    // Filter out empty bullets
    const bullets = newResumeSection.bullets?.filter(bullet => bullet.trim() !== '') || []
    
    // Create new section with ID
    const sectionWithId: ResumeSection = {
      ...newResumeSection,
      bullets,
      id: `${newResumeSection.type}${Date.now()}`
    }
    
    // Add to resume sections
    setResumeSections([...resumeSections, sectionWithId])
    
    // Reset form
    setNewResumeSection({
      type: resumeSectionType as "experience" | "education" | "skills" | "projects" | "certifications",
      title: "",
      organization: "",
      date: "",
      description: "",
      bullets: ["", "", ""]
    })
    
    // Close dialog
    setShowAddResumeDialog(false)
    
    toast({
      title: "Resume section added",
      description: `New ${resumeSectionType} section has been added to your resume.`
    })
  }
  
  // Handle editing a resume section
  const handleEditResumeSection = () => {
    if (!selectedResumeSection) return
    
    // Validation
    if (!selectedResumeSection.title || (selectedResumeSection.type !== 'skills' && !selectedResumeSection.organization)) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }
    
    // Filter out empty bullets
    const bullets = selectedResumeSection.bullets?.filter(bullet => bullet.trim() !== '') || []
    
    // Update section
    const updatedSections = resumeSections.map(section => 
      section.id === selectedResumeSection.id 
        ? { ...selectedResumeSection, bullets } 
        : section
    )
    
    setResumeSections(updatedSections)
    
    // Reset state
    setSelectedResumeSection(null)
    
    toast({
      title: "Resume section updated",
      description: `Your ${selectedResumeSection.type} section has been updated.`
    })
  }
  
  // Handle deleting a resume section
  const handleDeleteResumeSection = (id: string) => {
    setResumeSections(resumeSections.filter(section => section.id !== id))
    
    toast({
      title: "Resume section deleted",
      description: "The section has been removed from your resume."
    })
  }
  
  // Handle deleting a business card
  const handleDeleteCard = (id: string) => {
    setMyCards(myCards.filter(card => card.id !== id))
    
    toast({
      title: "Business card deleted",
      description: "The business card has been deleted."
    })
  }
  
  // Helper to get icon based on opportunity type
  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'conference': return <Users className="h-5 w-5" />
      case 'community': return <Users className="h-5 w-5" />
      case 'program': return <FileText className="h-5 w-5" />
      case 'mentorship': return <User className="h-5 w-5" />
      case 'organization': return <Building className="h-5 w-5" />
      default: return <Users className="h-5 w-5" />
    }
  }
  
  // Helper to get icon based on resume section type
  const getResumeSectionIcon = (type: string) => {
    switch (type) {
      case 'experience': return <Briefcase className="h-5 w-5" />
      case 'education': return <Globe className="h-5 w-5" />
      case 'skills': return <CheckCircle2 className="h-5 w-5" />
      case 'projects': return <FileText className="h-5 w-5" />
      case 'certifications': return <Download className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
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
          <h1 className="text-xl font-bold">Networking</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10 w-full"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="networking" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Networking</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>Business Cards</span>
            </TabsTrigger>
            <TabsTrigger value="resume" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Resume Builder</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Networking Opportunities Tab */}
          <TabsContent value="networking" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">AI-Suggested Networking Opportunities</h2>
              <Badge variant="outline" className="text-xs">
                Based on your career profile
              </Badge>
            </div>
            
            {isLoadingEvents ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                <p className="text-muted-foreground">Loading networking opportunities...</p>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {networkingError ? 'Error loading networking events' : 'No networking opportunities found'}
                </p>
                {(searchQuery || networkingError) && (
                  <Button 
                    variant="link" 
                    className="mt-1 h-auto p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    {networkingError ? 'Try again' : 'Clear search'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredOpportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getOpportunityIcon(opportunity.type)}
                          <CardTitle className="text-base">{opportunity.title}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {opportunity.industry}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                        {opportunity.date && ` • ${opportunity.date}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {opportunity.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium">{opportunity.relevanceScore}% Relevant</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-8" asChild>
                        <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
                          Visit <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="pt-4">
              <h3 className="text-base font-medium mb-1">Need more personalized suggestions?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete more sections of your profile or take our career assessment to get better networking recommendations.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-1" onClick={() => handleBack()}>
                  <FileText className="h-4 w-4" />
                  <span>Update Profile</span>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Business Cards Tab */}
          <TabsContent value="cards" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">My Business Cards</h2>
              <Button variant="outline" size="sm" onClick={() => setShowAddCardDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Card
              </Button>
            </div>
            
            {filteredCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg">
                <Briefcase className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-2">No business cards found</p>
                <Button onClick={() => setShowAddCardDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Business Card
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCards.map((card) => (
                  <Card key={card.id} className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={card.avatarUrl} />
                            <AvatarFallback>{card.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{card.name}</h3>
                            <p className="text-sm text-muted-foreground">{card.title}</p>
                            <p className="text-sm text-muted-foreground">{card.company}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowShareCardDialog(card.id)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{card.email}</span>
                        </div>
                        {card.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{card.phone}</span>
                          </div>
                        )}
                        {card.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>{card.website}</span>
                          </div>
                        )}
                        {card.linkedin && (
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-muted-foreground" />
                            <span>{card.linkedin}</span>
                          </div>
                        )}
                      </div>
                      
                      {card.tagline && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm italic">"{card.tagline}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Resume Builder Tab */}
          <TabsContent value="resume" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Resume Builder</h2>
              <Dialog open={showAddResumeDialog} onOpenChange={setShowAddResumeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Resume Section</DialogTitle>
                    <DialogDescription>
                      Create a new section for your resume. This will be used to generate your professional resume.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="sectionType">Section Type</Label>
                      <Select
                        value={resumeSectionType}
                        onValueChange={(value) => {
                          setResumeSectionType(value)
                          setNewResumeSection(prev => ({ ...prev, type: value as "experience" | "education" | "skills" | "projects" | "certifications" }))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="experience">Work Experience</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="skills">Skills</SelectItem>
                          <SelectItem value="projects">Projects</SelectItem>
                          <SelectItem value="certifications">Certifications</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Title*</Label>
                      <Input
                        id="title"
                        value={newResumeSection.title}
                        onChange={(e) => setNewResumeSection(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={
                          resumeSectionType === "experience" ? "Job Title" :
                          resumeSectionType === "education" ? "Degree" :
                          resumeSectionType === "skills" ? "Skill Category" :
                          resumeSectionType === "projects" ? "Project Name" :
                          "Certification Name"
                        }
                      />
                    </div>
                    
                    {resumeSectionType !== "skills" && (
                      <div className="space-y-2">
                        <Label htmlFor="organization">
                          {resumeSectionType === "experience" ? "Company*" :
                           resumeSectionType === "education" ? "Institution*" :
                           resumeSectionType === "projects" ? "Organization" :
                           "Issuing Organization*"}
                        </Label>
                        <Input
                          id="organization"
                          value={newResumeSection.organization || ""}
                          onChange={(e) => setNewResumeSection(prev => ({ ...prev, organization: e.target.value }))}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="date">
                        {resumeSectionType === "experience" || resumeSectionType === "education" ? "Date Range" :
                         resumeSectionType === "projects" ? "Completion Date" :
                         "Issue Date"}
                      </Label>
                      <Input
                        id="date"
                        value={newResumeSection.date || ""}
                        onChange={(e) => setNewResumeSection(prev => ({ ...prev, date: e.target.value }))}
                        placeholder={resumeSectionType === "experience" ? "e.g., 2020 - Present" : "e.g., May 2023"}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newResumeSection.description}
                        onChange={(e) => setNewResumeSection(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Key Points (Bullet Points)</Label>
                      {newResumeSection.bullets?.map((bullet, index) => (
                        <Input
                          key={index}
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...(newResumeSection.bullets || [])]
                            newBullets[index] = e.target.value
                            setNewResumeSection(prev => ({ ...prev, bullets: newBullets }))
                          }}
                          placeholder={`Bullet point ${index + 1}`}
                          className="mb-2"
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewResumeSection(prev => ({ 
                          ...prev, 
                          bullets: [...(prev.bullets || []), ""] 
                        }))}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Bullet
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddResumeDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddResumeSection}>
                      Add to Resume
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {Object.keys(filteredResumeSections).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-2">No resume sections found</p>
                <Button onClick={() => setShowAddResumeDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Section
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Experience Section */}
                {filteredResumeSections.experience && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-base font-semibold">Experience</h3>
                    </div>
                    <div className="space-y-3">
                      {filteredResumeSections.experience.map((section) => (
                        <Card key={section.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div>
                                <CardTitle className="text-base">{section.title}</CardTitle>
                                <CardDescription>
                                  {section.organization} {section.date && `• ${section.date}`}
                                </CardDescription>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedResumeSection(section)
                                    setResumeSectionType(section.type)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => handleDeleteResumeSection(section.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3">
                            {section.description && (
                              <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                            )}
                            {section.bullets && section.bullets.length > 0 && (
                              <ul className="text-sm space-y-1 list-disc pl-5">
                                {section.bullets.map((bullet, i) => (
                                  <li key={i}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Education Section */}
                {filteredResumeSections.education && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-base font-semibold">Education</h3>
                    </div>
                    <div className="space-y-3">
                      {filteredResumeSections.education.map((section) => (
                        <Card key={section.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div>
                                <CardTitle className="text-base">{section.title}</CardTitle>
                                <CardDescription>
                                  {section.organization} {section.date && `• ${section.date}`}
                                </CardDescription>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedResumeSection(section)
                                    setResumeSectionType(section.type)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => handleDeleteResumeSection(section.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3">
                            {section.description && (
                              <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                            )}
                            {section.bullets && section.bullets.length > 0 && (
                              <ul className="text-sm space-y-1 list-disc pl-5">
                                {section.bullets.map((bullet, i) => (
                                  <li key={i}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Skills Section */}
                {filteredResumeSections.skills && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-base font-semibold">Skills</h3>
                    </div>
                    <div className="space-y-3">
                      {filteredResumeSections.skills.map((section) => (
                        <Card key={section.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div>
                                <CardTitle className="text-base">{section.title}</CardTitle>
                                {section.description && (
                                  <CardDescription>{section.description}</CardDescription>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedResumeSection(section)
                                    setResumeSectionType(section.type)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => handleDeleteResumeSection(section.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3">
                            {section.bullets && section.bullets.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {section.bullets.map((bullet, i) => (
                                  <Badge key={i} variant="secondary">
                                    {bullet}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Other Sections (Projects, Certifications) */}
                {Object.entries(filteredResumeSections)
                  .filter(([type]) => !['experience', 'education', 'skills'].includes(type))
                  .map(([type, sections]) => (
                    <div key={type} className="space-y-3">
                      <div className="flex items-center">
                        {type === 'projects' ? 
                          <FileText className="h-5 w-5 mr-2 text-primary" /> : 
                          <Download className="h-5 w-5 mr-2 text-primary" />}
                        <h3 className="text-base font-semibold">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {sections.map((section) => (
                          <Card key={section.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <div>
                                  <CardTitle className="text-base">{section.title}</CardTitle>
                                  <CardDescription>
                                    {section.organization && `${section.organization} `}
                                    {section.date && `• ${section.date}`}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedResumeSection(section)
                                      setResumeSectionType(section.type)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive"
                                    onClick={() => handleDeleteResumeSection(section.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                              {section.description && (
                                <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                              )}
                              {section.bullets && section.bullets.length > 0 && (
                                <ul className="text-sm space-y-1 list-disc pl-5">
                                  {section.bullets.map((bullet, i) => (
                                    <li key={i}>{bullet}</li>
                                  ))}
                                </ul>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                
                {/* Export Actions */}
                <div className="flex justify-center mt-4 pt-4 border-t">
                  <Button className="gap-1">
                    <DownloadCloud className="h-4 w-4" />
                    <span>Download Resume</span>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Business Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Business Card</DialogTitle>
            <DialogDescription>
              Create a professional business card to share with your network.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name*</Label>
              <Input
                id="name"
                value={newCard.name}
                onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Job Title*</Label>
              <Input
                id="title"
                value={newCard.title}
                onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization*</Label>
              <Input
                id="company"
                value={newCard.company}
                onChange={(e) => setNewCard(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address*</Label>
              <Input
                id="email"
                value={newCard.email}
                onChange={(e) => setNewCard(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newCard.phone || ""}
                onChange={(e) => setNewCard(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={newCard.website || ""}
                onChange={(e) => setNewCard(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={newCard.linkedin || ""}
                onChange={(e) => setNewCard(prev => ({ ...prev, linkedin: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline/Bio</Label>
              <Textarea
                id="tagline"
                value={newCard.tagline || ""}
                onChange={(e) => setNewCard(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="A brief professional statement"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCard}>
              Create Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Resume Section Dialog */}
      {selectedResumeSection && (
        <Dialog
          open={!!selectedResumeSection}
          onOpenChange={(open) => !open && setSelectedResumeSection(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Resume Section</DialogTitle>
              <DialogDescription>
                Update this section of your resume.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title*</Label>
                <Input
                  id="edit-title"
                  value={selectedResumeSection.title}
                  onChange={(e) => setSelectedResumeSection({ ...selectedResumeSection, title: e.target.value })}
                />
              </div>
              
              {selectedResumeSection.type !== "skills" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-organization">
                    {selectedResumeSection.type === "experience" ? "Company*" :
                     selectedResumeSection.type === "education" ? "Institution*" :
                     selectedResumeSection.type === "projects" ? "Organization" :
                     "Issuing Organization*"}
                  </Label>
                  <Input
                    id="edit-organization"
                    value={selectedResumeSection.organization || ""}
                    onChange={(e) => setSelectedResumeSection({ ...selectedResumeSection, organization: e.target.value })}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-date">
                  {selectedResumeSection.type === "experience" || selectedResumeSection.type === "education" ? "Date Range" :
                   selectedResumeSection.type === "projects" ? "Completion Date" :
                   "Issue Date"}
                </Label>
                <Input
                  id="edit-date"
                  value={selectedResumeSection.date || ""}
                  onChange={(e) => setSelectedResumeSection({ ...selectedResumeSection, date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedResumeSection.description}
                  onChange={(e) => setSelectedResumeSection({ ...selectedResumeSection, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Key Points (Bullet Points)</Label>
                {selectedResumeSection.bullets?.map((bullet, index) => (
                  <Input
                    key={index}
                    value={bullet}
                    onChange={(e) => {
                      const newBullets = [...(selectedResumeSection.bullets || [])];
                      newBullets[index] = e.target.value;
                      setSelectedResumeSection({ ...selectedResumeSection, bullets: newBullets });
                    }}
                    className="mb-2"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedResumeSection({ 
                    ...selectedResumeSection, 
                    bullets: [...(selectedResumeSection.bullets || []), ""] 
                  })}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Bullet
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedResumeSection(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditResumeSection}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Share Business Card Dialog */}
      <Dialog
        open={!!showShareCardDialog}
        onOpenChange={(open) => !open && setShowShareCardDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Business Card</DialogTitle>
            <DialogDescription>
              Share your business card with your network.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4">
            {showShareCardDialog && (
              <div className="w-full max-w-sm p-4 border rounded-lg bg-card">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarFallback>{myCards.find(c => c.id === showShareCardDialog)?.name.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">
                    {myCards.find(c => c.id === showShareCardDialog)?.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {myCards.find(c => c.id === showShareCardDialog)?.title}
                  </p>
                  <p className="text-muted-foreground">
                    {myCards.find(c => c.id === showShareCardDialog)?.company}
                  </p>
                  
                  <Separator className="my-3" />
                  
                  <div className="w-full text-sm space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{myCards.find(c => c.id === showShareCardDialog)?.email}</span>
                    </div>
                    
                    {myCards.find(c => c.id === showShareCardDialog)?.phone && (
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{myCards.find(c => c.id === showShareCardDialog)?.phone}</span>
                      </div>
                    )}
                    
                    {myCards.find(c => c.id === showShareCardDialog)?.website && (
                      <div className="flex items-center justify-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{myCards.find(c => c.id === showShareCardDialog)?.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex w-full justify-center gap-2 mt-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}