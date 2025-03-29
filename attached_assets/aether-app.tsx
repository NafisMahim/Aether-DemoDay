"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Main App Component
export default function AetherApp() {
  const router = useRouter()
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

  // Handle login
  const handleLogin = () => {
    if (username && password) {
      setCurrentScreen("home")
      setErrorMessage("")
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
    console.log(`Logging in with ${provider}`)
    // In a real app, this would handle OAuth
    setCurrentScreen("home")
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
            />
          ) : currentScreen === "home" ? (
            <HomeScreen username="Richard Wang" navigateTo={navigateTo} quizResults={quizResults} />
          ) : currentScreen === "quiz" ? (
            <QuizScreen handleBack={handleBack} />
          ) : currentScreen === "interests" ? (
            <InterestsScreen handleBack={handleBack} />
          ) : currentScreen === "experience" ? (
            <ExperienceScreen handleBack={handleBack} />
          ) : currentScreen === "financials" ? (
            <FinancialsScreen handleBack={handleBack} />
          ) : currentScreen === "locations" ? (
            <LocationsScreen handleBack={handleBack} />
          ) : currentScreen === "profile" ? (
            <ProfileScreen handleBack={handleBack} username="Richard Wang" quizResults={quizResults} />
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

// Login Screen Component
interface LoginScreenProps {
  username: string
  setUsername: (value: string) => void
  password: string
  setPassword: (value: string) => void
  handleLogin: () => void
  handleSocialLogin: (provider: string) => void
  errorMessage: string
}

function LoginScreen({
  username,
  setUsername,
  password,
  setPassword,
  handleLogin,
  handleSocialLogin,
  errorMessage,
}: LoginScreenProps) {
  return (
    <div className="flex flex-col justify-center items-center h-full px-6">
      <div className="w-full max-w-[320px] bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-center mb-4">
          <div className="relative w-[100px] h-[100px]">
            <Image src="/images/aether-logo.png" alt="Aether Logo" fill className="object-contain" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">Aether</h1>
        <p className="text-sm text-gray-500 text-center mb-6">The Ultimate Personal Assistant</p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Email or Username"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

          <button
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            onClick={handleLogin}
          >
            Continue
          </button>

          <p className="text-sm text-blue-600 text-center cursor-pointer hover:underline">Forgot Password?</p>

          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <p className="mx-4 text-sm text-gray-500 font-medium">OR</p>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <button
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
            onClick={() => handleSocialLogin("Google")}
          >
            <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="truncate">Continue with Google</span>
          </button>

          <button
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
            onClick={() => handleSocialLogin("Microsoft")}
          >
            <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 23 23">
              <path fill="#f25022" d="M1 1h10v10H1z" />
              <path fill="#00a4ef" d="M1 12h10v10H1z" />
              <path fill="#7fba00" d="M12 1h10v10H12z" />
              <path fill="#ffb900" d="M12 12h10v10H12z" />
            </svg>
            <span className="truncate">Continue with Microsoft</span>
          </button>

          <button
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
            onClick={() => handleSocialLogin("Phone")}
          >
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              ></path>
            </svg>
            <span className="truncate">Continue with Phone</span>
          </button>

          <p className="text-sm text-center mt-4">
            No account yet? <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Sign up</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Home Screen Component
interface HomeScreenProps {
  username: string
  navigateTo: (page: string) => void
  quizResults: any
}

function HomeScreen({ username, navigateTo, quizResults }: HomeScreenProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <div className="flex items-center">
          <div className="relative w-[40px] h-[40px]">
            <Image src="/images/aether-logo.png" alt="Aether Logo" fill className="object-contain" />
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
          onClick={() => navigateTo("premium")}
        >
          Premium
        </button>
      </header>

      {/* User Profile */}
      <section className="px-5 mt-2">
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-md p-5 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-xl mb-3 flex items-center justify-center text-2xl font-bold text-gray-400">
            {username.charAt(0)}
          </div>
          <h2 className="text-lg font-bold">{username}</h2>
          <p className="text-xs text-gray-500 italic mt-1">"Exploring new opportunities and personal growth!"</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-5 mt-6 flex flex-col items-center">
        <button
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-3 rounded-lg shadow-md mb-4 transform hover:scale-[1.02] transition-all duration-200"
          onClick={() => navigateTo("quiz")}
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
      <footer className="mt-auto px-4 pb-6">
        <nav className="bg-gray-100 rounded-2xl p-2 flex justify-around">
          <NavButton icon="🏠" label="Home" active onClick={() => navigateTo("home")} />
          <NavButton icon="🔔" label="Notifications" onClick={() => navigateTo("notifications")} />
          <NavButton icon="💬" label="Messages" onClick={() => navigateTo("messages")} />
          <NavButton icon="👤" label="Profile" onClick={() => navigateTo("profile")} />
        </nav>
      </footer>
    </div>
  )
}

// Category Button Component
interface CategoryButtonProps {
  icon: string
  label: string
  onClick: () => void
}

function CategoryButton({ icon, label, onClick }: CategoryButtonProps) {
  return (
    <button
      className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transform hover:scale-[1.03] transition-all duration-200"
      onClick={onClick}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

// Navigation Button Component
interface NavButtonProps {
  icon: string
  label: string
  active?: boolean
  onClick: () => void
}

function NavButton({ icon, label, active = false, onClick }: NavButtonProps) {
  return (
    <button
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl ${
        active ? "bg-white shadow-md" : "hover:bg-white/50 transition-colors duration-200"
      }`}
      onClick={onClick}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
}

// Quiz Screen Component
interface QuizScreenProps {
  handleBack: (data?: any) => void
}

function QuizScreen({ handleBack }: QuizScreenProps) {
  const [quizState, setQuizState] = useState<"questions" | "results">("questions")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])

  // Career-oriented advanced questions
  const questions = [
    {
      question:
        "Which strategic leadership approach do you most frequently employ in complex organizational challenges?",
      options: [
        "Transformational (inspiring innovation and change)",
        "Servant (prioritizing team needs and development)",
        "Situational (adapting style to specific contexts)",
        "Directive (providing clear structure and guidance)",
      ],
    },
    {
      question:
        "When evaluating potential career advancement opportunities, which factor carries the most weight in your decision-making process?",
      options: [
        "Intellectual challenge and skill development",
        "Organizational culture and work-life integration",
        "Compensation package and financial incentives",
        "Leadership potential and decision-making authority",
      ],
    },
    {
      question: "How do you typically approach cross-functional collaboration in high-stakes projects?",
      options: [
        "Establish clear governance and decision frameworks first",
        "Focus on relationship-building before tactical execution",
        "Implement agile methodologies with regular feedback loops",
        "Leverage subject matter expertise with defined handoffs",
      ],
    },
    {
      question:
        "Which professional development methodology has yielded the most significant growth in your career trajectory?",
      options: [
        "Structured mentorship and executive coaching",
        "Self-directed learning and specialized certifications",
        "Experiential learning through stretch assignments",
        "Peer learning networks and communities of practice",
      ],
    },
    {
      question: "When navigating organizational change, which approach best characterizes your contribution?",
      options: [
        "Change catalyst - driving innovation and new initiatives",
        "Change stabilizer - ensuring operational continuity",
        "Change communicator - facilitating understanding and buy-in",
        "Change analyst - evaluating impacts and optimizing processes",
      ],
    },
    {
      question: "How do you primarily measure your professional success and impact?",
      options: [
        "Quantifiable business outcomes and financial metrics",
        "Team development and organizational capability building",
        "Innovation implementation and market differentiation",
        "Stakeholder satisfaction and relationship strength",
      ],
    },
    {
      question:
        "Which technological competency do you believe will be most critical to develop in your field over the next 5 years?",
      options: [
        "AI/ML implementation and ethical governance",
        "Data analytics and insight generation",
        "Digital transformation and legacy system integration",
        "Cybersecurity and privacy protection frameworks",
      ],
    },
    {
      question:
        "In resource-constrained environments, how do you typically prioritize competing strategic initiatives?",
      options: [
        "ROI-based analysis with quantitative scoring models",
        "Alignment with core organizational mission and values",
        "Stakeholder influence mapping and coalition building",
        "Capability-based assessment of execution feasibility",
      ],
    },
    {
      question: "Which approach to professional networking has proven most valuable in your career development?",
      options: [
        "Industry-specific communities and formal associations",
        "Cross-industry thought leadership and knowledge exchange",
        "Strategic internal relationship building and sponsorship",
        "Digital platform engagement and content creation",
      ],
    },
    {
      question: "When faced with significant professional setbacks, which resilience strategy do you most rely upon?",
      options: [
        "Analytical problem deconstruction and root cause analysis",
        "Seeking diverse perspectives and collaborative solutions",
        "Rapid prototyping of alternative approaches",
        "Reflective practice and mindfulness techniques",
      ],
    },
  ]

  const handleSelectAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Quiz completed, show results
      setQuizState("results")
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  // Sophisticated analysis of quiz answers
  const calculateResults = () => {
    // Skip if no answers
    if (answers.length === 0) {
      return {
        leadershipStyle: { transformational: 0, servant: 0, situational: 0, directive: 0 },
        careerPriorities: { intellectual: 0, cultural: 0, financial: 0, authority: 0 },
        recommendedTopics: [],
        careerPath: "",
        developmentAreas: [],
        strengths: [],
      }
    }

    // Initialize counters for different aspects
    const leadershipStyle = { transformational: 0, servant: 0, situational: 0, directive: 0 }
    const careerPriorities = { intellectual: 0, cultural: 0, financial: 0, authority: 0 }
    const collaborationStyle = { structured: 0, relational: 0, agile: 0, expertise: 0 }
    const developmentPreference = { mentorship: 0, selfDirected: 0, experiential: 0, peer: 0 }
    const changeRole = { catalyst: 0, stabilizer: 0, communicator: 0, analyst: 0 }
    const successMetrics = { business: 0, people: 0, innovation: 0, stakeholder: 0 }
    const techFocus = { ai: 0, data: 0, digital: 0, security: 0 }
    const prioritizationApproach = { roi: 0, mission: 0, stakeholder: 0, capability: 0 }
    const networkingStyle = { industry: 0, thought: 0, internal: 0, digital: 0 }
    const resilienceStrategy = { analytical: 0, collaborative: 0, experimental: 0, reflective: 0 }

    // Analyze leadership style (Q1)
    if (answers[0]?.includes("Transformational")) leadershipStyle.transformational += 3
    else if (answers[0]?.includes("Servant")) leadershipStyle.servant += 3
    else if (answers[0]?.includes("Situational")) leadershipStyle.situational += 3
    else if (answers[0]?.includes("Directive")) leadershipStyle.directive += 3

    // Analyze career priorities (Q2)
    if (answers[1]?.includes("Intellectual")) careerPriorities.intellectual += 3
    else if (answers[1]?.includes("Organizational culture")) careerPriorities.cultural += 3
    else if (answers[1]?.includes("Compensation")) careerPriorities.financial += 3
    else if (answers[1]?.includes("Leadership potential")) careerPriorities.authority += 3

    // Analyze collaboration style (Q3)
    if (answers[2]?.includes("Establish clear governance")) collaborationStyle.structured += 3
    else if (answers[2]?.includes("relationship-building")) collaborationStyle.relational += 3
    else if (answers[2]?.includes("agile methodologies")) collaborationStyle.agile += 3
    else if (answers[2]?.includes("subject matter expertise")) collaborationStyle.expertise += 3

    // Analyze development preference (Q4)
    if (answers[3]?.includes("mentorship")) developmentPreference.mentorship += 3
    else if (answers[3]?.includes("Self-directed")) developmentPreference.selfDirected += 3
    else if (answers[3]?.includes("Experiential")) developmentPreference.experiential += 3
    else if (answers[3]?.includes("Peer learning")) developmentPreference.peer += 3

    // Analyze change role (Q5)
    if (answers[4]?.includes("Change catalyst")) changeRole.catalyst += 3
    else if (answers[4]?.includes("Change stabilizer")) changeRole.stabilizer += 3
    else if (answers[4]?.includes("Change communicator")) changeRole.communicator += 3
    else if (answers[4]?.includes("Change analyst")) changeRole.analyst += 3

    // Analyze success metrics (Q6)
    if (answers[5]?.includes("Quantifiable business")) successMetrics.business += 3
    else if (answers[5]?.includes("Team development")) successMetrics.people += 3
    else if (answers[5]?.includes("Innovation implementation")) successMetrics.innovation += 3
    else if (answers[5]?.includes("Stakeholder satisfaction")) successMetrics.stakeholder += 3

    // Analyze tech focus (Q7)
    if (answers[6]?.includes("AI/ML")) techFocus.ai += 3
    else if (answers[6]?.includes("Data analytics")) techFocus.data += 3
    else if (answers[6]?.includes("Digital transformation")) techFocus.digital += 3
    else if (answers[6]?.includes("Cybersecurity")) techFocus.security += 3

    // Analyze prioritization approach (Q8)
    if (answers[7]?.includes("ROI-based")) prioritizationApproach.roi += 3
    else if (answers[7]?.includes("Alignment with core")) prioritizationApproach.mission += 3
    else if (answers[7]?.includes("Stakeholder influence")) prioritizationApproach.stakeholder += 3
    else if (answers[7]?.includes("Capability-based")) prioritizationApproach.capability += 3

    // Analyze networking style (Q9)
    if (answers[8]?.includes("Industry-specific")) networkingStyle.industry += 3
    else if (answers[8]?.includes("Cross-industry")) networkingStyle.thought += 3
    else if (answers[8]?.includes("Strategic internal")) networkingStyle.internal += 3
    else if (answers[8]?.includes("Digital platform")) networkingStyle.digital += 3

    // Analyze resilience strategy (Q10)
    if (answers[9]?.includes("Analytical problem")) resilienceStrategy.analytical += 3
    else if (answers[9]?.includes("Seeking diverse perspectives")) resilienceStrategy.collaborative += 3
    else if (answers[9]?.includes("Rapid prototyping")) resilienceStrategy.experimental += 3
    else if (answers[9]?.includes("Reflective practice")) resilienceStrategy.reflective += 3

    // Cross-question analysis for leadership style
    if (answers[4]?.includes("Change catalyst")) leadershipStyle.transformational += 1
    if (answers[5]?.includes("Team development")) leadershipStyle.servant += 1
    if (answers[2]?.includes("agile methodologies")) leadershipStyle.situational += 1
    if (answers[7]?.includes("ROI-based")) leadershipStyle.directive += 1

    // Cross-question analysis for career priorities
    if (answers[3]?.includes("Self-directed")) careerPriorities.intellectual += 1
    if (answers[8]?.includes("Strategic internal")) careerPriorities.cultural += 1
    if (answers[5]?.includes("Quantifiable business")) careerPriorities.financial += 1
    if (answers[0]?.includes("Directive")) careerPriorities.authority += 1

    // Determine dominant leadership style
    const dominantLeadership = Object.entries(leadershipStyle).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

    // Determine dominant career priority
    const dominantPriority = Object.entries(careerPriorities).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

    // Determine dominant tech focus
    const dominantTech = Object.entries(techFocus).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

    // Determine career path based on patterns
    let careerPath = ""
    if (leadershipStyle.transformational > 2 && successMetrics.innovation > 2) {
      careerPath = "Innovation Leadership"
    } else if (leadershipStyle.servant > 2 && successMetrics.people > 2) {
      careerPath = "People & Culture Leadership"
    } else if (leadershipStyle.directive > 2 && successMetrics.business > 2) {
      careerPath = "Operational Excellence"
    } else if (prioritizationApproach.roi > 2 && careerPriorities.financial > 2) {
      careerPath = "Strategic Finance"
    } else if (techFocus.ai > 2 || techFocus.data > 2) {
      careerPath = "Data & AI Strategy"
    } else if (changeRole.communicator > 2 && networkingStyle.thought > 2) {
      careerPath = "Change & Communications Leadership"
    } else if (collaborationStyle.agile > 2 && resilienceStrategy.experimental > 2) {
      careerPath = "Agile Transformation"
    } else {
      careerPath = "Strategic Leadership"
    }

    // Determine recommended topics based on patterns
    const recommendedTopics = []

    // Leadership development topics
    if (dominantLeadership === "transformational") {
      recommendedTopics.push("Disruptive Innovation Strategies")
      recommendedTopics.push("Leading Through Organizational Transformation")
    } else if (dominantLeadership === "servant") {
      recommendedTopics.push("Coaching for High Performance")
      recommendedTopics.push("Building Psychological Safety in Teams")
    } else if (dominantLeadership === "situational") {
      recommendedTopics.push("Adaptive Leadership in Complex Environments")
      recommendedTopics.push("Contextual Decision-Making Frameworks")
    } else if (dominantLeadership === "directive") {
      recommendedTopics.push("Strategic Planning and Execution")
      recommendedTopics.push("Performance Management Systems")
    }

    // Tech-focused topics
    if (dominantTech === "ai") {
      recommendedTopics.push("AI Ethics and Governance")
      recommendedTopics.push("Machine Learning Implementation Strategy")
    } else if (dominantTech === "data") {
      recommendedTopics.push("Data-Driven Decision Making")
      recommendedTopics.push("Advanced Analytics for Business Leaders")
    } else if (dominantTech === "digital") {
      recommendedTopics.push("Digital Transformation Roadmapping")
      recommendedTopics.push("Legacy System Modernization")
    } else if (dominantTech === "security") {
      recommendedTopics.push("Cybersecurity Risk Management")
      recommendedTopics.push("Privacy-by-Design Principles")
    }

    // Career development topics
    if (dominantPriority === "intellectual") {
      recommendedTopics.push("Continuous Learning Ecosystems")
      recommendedTopics.push("Knowledge Management Strategy")
    } else if (dominantPriority === "cultural") {
      recommendedTopics.push("Organizational Culture Design")
      recommendedTopics.push("Work-Life Integration Models")
    } else if (dominantPriority === "financial") {
      recommendedTopics.push("Executive Compensation Strategies")
      recommendedTopics.push("Financial Acumen for Leaders")
    } else if (dominantPriority === "authority") {
      recommendedTopics.push("Executive Presence Development")
      recommendedTopics.push("Strategic Influence and Persuasion")
    }

    // Determine development areas
    const developmentAreas = []

    // Find lowest scores across different dimensions
    const lowestLeadership = Object.entries(leadershipStyle).reduce((a, b) => (a[1] < b[1] ? a : b))[0]
    const lowestPriority = Object.entries(careerPriorities).reduce((a, b) => (a[1] < b[1] ? a : b))[0]

    if (lowestLeadership === "transformational") developmentAreas.push("Innovation Mindset")
    if (lowestLeadership === "servant") developmentAreas.push("Empathetic Leadership")
    if (lowestLeadership === "situational") developmentAreas.push("Contextual Adaptability")
    if (lowestLeadership === "directive") developmentAreas.push("Structured Decision Making")

    if (lowestPriority === "intellectual") developmentAreas.push("Continuous Learning")
    if (lowestPriority === "cultural") developmentAreas.push("Organizational Awareness")
    if (lowestPriority === "financial") developmentAreas.push("Financial Acumen")
    if (lowestPriority === "authority") developmentAreas.push("Executive Presence")

    if (resilienceStrategy.analytical < 2) developmentAreas.push("Critical Problem Analysis")
    if (networkingStyle.thought < 2) developmentAreas.push("Thought Leadership")
    if (collaborationStyle.agile < 2) developmentAreas.push("Agile Methodologies")

    // Determine strengths
    const strengths = []

    // Leadership strengths
    if (leadershipStyle.transformational > 2) strengths.push("Change Leadership")
    if (leadershipStyle.servant > 2) strengths.push("Team Development")
    if (leadershipStyle.situational > 2) strengths.push("Adaptability")
    if (leadershipStyle.directive > 2) strengths.push("Strategic Direction")

    // Collaboration strengths
    if (collaborationStyle.structured > 2) strengths.push("Process Optimization")
    if (collaborationStyle.relational > 2) strengths.push("Relationship Building")
    if (collaborationStyle.agile > 2) strengths.push("Agile Implementation")
    if (collaborationStyle.expertise > 2) strengths.push("Subject Matter Expertise")

    // Additional strengths
    if (changeRole.catalyst > 2) strengths.push("Innovation Catalyst")
    if (successMetrics.business > 2) strengths.push("Business Acumen")
    if (resilienceStrategy.reflective > 2) strengths.push("Reflective Practice")
    if (networkingStyle.digital > 2) strengths.push("Digital Engagement")

    // Calculate percentages for visualization
    const total = Object.values(leadershipStyle).reduce((sum, val) => sum + val, 0) || 1
    const leadershipPercentages = {
      transformational: Math.round((leadershipStyle.transformational / total) * 100),
      servant: Math.round((leadershipStyle.servant / total) * 100),
      situational: Math.round((leadershipStyle.situational / total) * 100),
      directive: Math.round((leadershipStyle.directive / total) * 100),
    }

    // Ensure percentages add up to 100%
    const sum = Object.values(leadershipPercentages).reduce((s, v) => s + v, 0)
    if (sum < 100) {
      leadershipPercentages.transformational += 100 - sum
    } else if (sum > 100) {
      leadershipPercentages.transformational -= sum - 100
    }

    return {
      leadershipStyle: leadershipPercentages,
      careerPriorities,
      recommendedTopics: recommendedTopics.slice(0, 6), // Top 6 recommendations
      careerPath,
      developmentAreas: developmentAreas.slice(0, 4), // Top 4 development areas
      strengths: strengths.slice(0, 4), // Top 4 strengths
    }
  }

  const results = calculateResults()

  if (quizState === "results") {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center px-5 pt-8 pb-4">
          <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold ml-4">Career Insights</h1>
        </header>

        {/* Results */}
        <div className="flex-1 px-5 overflow-y-auto">
          {/* Career Path */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-5 mb-5 text-white">
            <h2 className="text-lg font-bold mb-1">Recommended Career Path</h2>
            <p className="text-2xl font-bold">{results.careerPath}</p>
          </div>

          {/* Leadership Style */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-5">
            <h2 className="text-lg font-bold mb-3">Leadership Style Profile</h2>

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Transformational</span>
                  <span className="text-sm font-medium">{results.leadershipStyle.transformational}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${results.leadershipStyle.transformational}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Servant</span>
                  <span className="text-sm font-medium">{results.leadershipStyle.servant}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${results.leadershipStyle.servant}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Situational</span>
                  <span className="text-sm font-medium">{results.leadershipStyle.situational}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full"
                    style={{ width: `${results.leadershipStyle.situational}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Directive</span>
                  <span className="text-sm font-medium">{results.leadershipStyle.directive}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-orange-500 h-2.5 rounded-full"
                    style={{ width: `${results.leadershipStyle.directive}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Development Areas */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-xl shadow-md p-5">
              <h2 className="text-lg font-bold mb-3">Key Strengths</h2>
              <ul className="space-y-2">
                {results.strengths.map((strength, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5">
              <h2 className="text-lg font-bold mb-3">Development Areas</h2>
              <ul className="space-y-2">
                {results.developmentAreas.map((area, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      ></path>
                    </svg>
                    <span className="text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Topics */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-5">
            <h2 className="text-lg font-bold mb-3">Recommended Learning Topics</h2>
            <div className="grid grid-cols-1 gap-2">
              {results.recommendedTopics.map((topic, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{topic}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-6 mt-4">
          <button
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg mb-3"
            onClick={() => handleBack(results)}
          >
            Apply Insights to Profile
          </button>
          <button
            className="w-full py-3 border border-gray-300 font-medium rounded-lg"
            onClick={() => {
              setQuizState("questions")
              setCurrentQuestion(0)
              setAnswers([])
            }}
          >
            Retake Assessment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Career Assessment</h1>
      </header>

      {/* Progress Bar */}
      <div className="px-5">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-gray-500 mt-1">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 px-5 mt-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{questions[currentQuestion].question}</h2>

        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                answers[currentQuestion] === option
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleSelectAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-6 mt-auto">
        <div className="flex gap-3">
          {currentQuestion > 0 && (
            <button className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg" onClick={handlePrevious}>
              Previous
            </button>
          )}
          <button
            className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${
              answers[currentQuestion] ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
          >
            {currentQuestion < questions.length - 1 ? "Next" : "See Results"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface InterestsScreenProps {
  handleBack: () => void
}

function InterestsScreen({ handleBack }: InterestsScreenProps) {
  const interests = [
    { id: 1, name: "Technology", icon: "💻", selected: true },
    { id: 2, name: "Business", icon: "💼", selected: false },
    { id: 3, name: "Arts", icon: "🎨", selected: true },
    { id: 4, name: "Science", icon: "🔬", selected: false },
    { id: 5, name: "Sports", icon: "⚽", selected: true },
    { id: 6, name: "Music", icon: "🎵", selected: false },
    { id: 7, name: "Travel", icon: "✈️", selected: true },
    { id: 8, name: "Food", icon: "🍕", selected: false },
    { id: 9, name: "Fashion", icon: "👕", selected: false },
    { id: 10, name: "Health", icon: "💪", selected: true },
    { id: 11, name: "Education", icon: "📚", selected: false },
    { id: 12, name: "Finance", icon: "💰", selected: true },
  ]

  const [selectedInterests, setSelectedInterests] = useState(
    interests.filter((interest) => interest.selected).map((interest) => interest.id),
  )

  const toggleInterest = (id: number) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((interestId) => interestId !== id))
    } else {
      setSelectedInterests([...selectedInterests, id])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Your Interests</h1>
      </header>

      {/* Interests Grid */}
      <div className="flex-1 px-5 mt-2 overflow-y-auto">
        <p className="text-sm text-gray-500 mb-4">
          Select the topics you're interested in to personalize your experience.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {interests.map((interest) => (
            <button
              key={interest.id}
              className={`p-4 rounded-xl border-2 flex items-center transition-all duration-200 ${
                selectedInterests.includes(interest.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => toggleInterest(interest.id)}
            >
              <span className="text-2xl mr-3">{interest.icon}</span>
              <span className="font-medium">{interest.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="px-5 pb-6 mt-4">
        <button className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg" onClick={handleBack}>
          Save Interests
        </button>
      </div>
    </div>
  )
}

interface SearchScreenProps {
  handleBack: () => void
}

function SearchScreen({ handleBack }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches] = useState([
    "Machine learning courses",
    "Web development jobs",
    "Financial planning tips",
    "Travel destinations 2023",
  ])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Search</h1>
      </header>

      {/* Search Input */}
      <div className="px-5">
        <div className="relative">
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
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
          <input
            type="text"
            placeholder="Search for anything..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Recent Searches */}
      <div className="flex-1 px-5 mt-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">RECENT SEARCHES</h2>

        <div className="space-y-2">
          {recentSearches.map((search, index) => (
            <div
              key={index}
              className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setSearchQuery(search)}
            >
              <svg
                className="w-5 h-5 text-gray-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>{search}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ComingSoonScreenProps {
  screen: string
  handleBack: () => void
}

function ComingSoonScreen({ screen, handleBack }: ComingSoonScreenProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">{screen.charAt(0).toUpperCase() + screen.slice(1)}</h1>
      </header>

      {/* Coming Soon */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-center">We're working hard to bring you this feature. Check back soon!</p>
      </div>

      {/* Back Button */}
      <div className="px-5 pb-6">
        <button className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg" onClick={handleBack}>
          Go Back Home
        </button>
      </div>
    </div>
  )
}

// ProfileScreen Component
interface ProfileScreenProps {
  handleBack: () => void
  username: string
  quizResults: any
}
function ProfileScreen({ handleBack, username, quizResults }: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "career" | "activity" | "settings">("overview")

  // Sample profile data
  const profileData = {
    name: username,
    position: "Senior Product Manager",
    company: "TechCorp International",
    location: "San Francisco, CA",
    connections: 357,
    about:
      "Strategic product leader with 8+ years of experience delivering innovative solutions in SaaS and enterprise software. Passionate about user-centered design and data-driven decision making.",
    experience: [
      {
        title: "Senior Product Manager",
        company: "TechCorp International",
        period: "2020 - Present",
        description:
          "Leading cross-functional teams to develop and execute product strategy for enterprise SaaS platform.",
      },
      {
        title: "Product Manager",
        company: "InnovateSoft",
        period: "2017 - 2020",
        description: "Managed full product lifecycle for analytics suite serving 200+ enterprise clients.",
      },
    ],
    education: [
      {
        degree: "MBA, Technology Management",
        institution: "Stanford University",
        year: "2017",
      },
      {
        degree: "BS, Computer Science",
        institution: "University of California, Berkeley",
        year: "2013",
      },
    ],
    skills: [
      "Product Strategy",
      "UX Design",
      "Market Research",
      "Agile/Scrum",
      "Data Analytics",
      "Cross-functional Leadership",
    ],
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Profile</h1>
      </header>

      {/* Profile Header */}
      <div className="px-5">
        <div className="bg-white rounded-xl shadow-md p-5 mb-5">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-xl font-bold text-blue-500 mr-4">
              {username.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profileData.name}</h2>
              <p className="text-sm text-gray-500">{profileData.position}</p>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
                {profileData.company}
                <svg
                  className="w-4 h-4 ml-2 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                {profileData.location}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold">{profileData.connections}</p>
              <p className="text-xs text-gray-500">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">12</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">4</p>
              <p className="text-xs text-gray-500">Certifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-3">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              activeTab === "overview" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              activeTab === "career" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("career")}
          >
            Career
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              activeTab === "activity" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              activeTab === "settings" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* About */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-2">About</h3>
              <p className="text-sm text-gray-600">{profileData.about}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Career Insights (if quiz taken) */}
            {quizResults && (
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-bold">Career Insights</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">From Assessment</span>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-blue-800">Recommended Path</p>
                  <p className="text-sm text-blue-700">{quizResults.careerPath}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Key Strengths</p>
                    <ul className="space-y-1">
                      {quizResults.strengths &&
                        quizResults.strengths.map((strength, idx) => (
                          <li key={idx} className="text-xs flex items-start">
                            <span className="text-green-500 mr-1">•</span> {strength}
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Development Areas</p>
                    <ul className="space-y-1">
                      {quizResults.developmentAreas &&
                        quizResults.developmentAreas.map((area, idx) => (
                          <li key={idx} className="text-xs flex items-start">
                            <span className="text-blue-500 mr-1">•</span> {area}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <button className="w-full text-xs text-blue-600 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  View Full Assessment Results
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "career" && (
          <div className="space-y-5">
            {/* Experience */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Experience</h3>
              <div className="space-y-4">
                {profileData.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <h4 className="text-sm font-semibold">{exp.title}</h4>
                    <p className="text-xs text-gray-500">
                      {exp.company} • {exp.period}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Education</h3>
              <div className="space-y-4">
                {profileData.education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <h4 className="text-sm font-semibold">{edu.degree}</h4>
                    <p className="text-xs text-gray-500">
                      {edu.institution} • Class of {edu.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Certifications</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Certified Scrum Product Owner (CSPO)</h4>
                    <p className="text-xs text-gray-500">Scrum Alliance • Issued May 2022</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex-shrink-0 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Product Analytics Certification</h4>
                    <p className="text-xs text-gray-500">Product School • Issued Jan 2023</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-5">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Recent Activity</h3>

              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center text-sm font-medium">
                        {username.charAt(0)}
                      </div>
                      <p className="text-sm font-medium">
                        {username} <span className="font-normal text-gray-500">completed an assessment</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">2d ago</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 ml-10">
                    <p className="text-sm font-medium">Career Assessment Results</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Identified strengths in Team Leadership and Strategic Planning
                    </p>
                  </div>
                </div>

                <div className="pb-4 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center text-sm font-medium">
                        {username.charAt(0)}
                      </div>
                      <p className="text-sm font-medium">
                        {username} <span className="font-normal text-gray-500">updated their interests</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">1w ago</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-10">
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">Technology</span>
                    <span className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full">Finance</span>
                    <span className="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-full">Health</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center text-sm font-medium">
                        {username.charAt(0)}
                      </div>
                      <p className="text-sm font-medium">
                        {username} <span className="font-normal text-gray-500">added a new position</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">2w ago</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 ml-10">
                    <p className="text-sm font-medium">Senior Product Manager at TechCorp International</p>
                    <p className="text-xs text-gray-500 mt-1">San Francisco, CA • Full-time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-5">
            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Account Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-xs text-gray-500">richard.wang@example.com</p>
                  </div>
                  <button className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                    Edit
                  </button>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                  </div>
                  <button className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                    Change
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Not enabled</p>
                  </div>
                  <button className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                    Set up
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Notification Settings</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Push Notifications</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm">Email Notifications</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm">Marketing Communications</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-md font-bold mb-3">Privacy Settings</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Profile Visibility</p>
                  <select className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                    <option>Public</option>
                    <option>Connections Only</option>
                    <option>Private</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm">Activity Visibility</p>
                  <select className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                    <option>All Users</option>
                    <option>Connections Only</option>
                    <option>Only Me</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// NotificationsScreen Component
function NotificationsScreen({ handleBack }: { handleBack: () => void }) {
  // Sample notifications data
  const notifications = [
    {
      id: 1,
      type: "connection",
      title: "Jane Cooper wants to connect",
      time: "Just now",
      read: false,
      image: "J",
      action: "Accept",
    },
    {
      id: 2,
      type: "message",
      title: "New message from Alex Morgan",
      preview: "Hey, I saw your profile and wanted to discuss...",
      time: "2 hours ago",
      read: false,
      image: "A",
    },
    {
      id: 3,
      type: "event",
      title: "Upcoming event: Career Fair 2023",
      time: "Tomorrow, 10:00 AM",
      read: true,
      image: "📅",
    },
    {
      id: 4,
      type: "recommendation",
      title: "We've found jobs matching your profile",
      preview: "5 new job opportunities in your area",
      time: "Yesterday",
      read: true,
      image: "💼",
    },
    {
      id: 5,
      type: "learning",
      title: "New course recommendation",
      preview: "Advanced Product Management - based on your interests",
      time: "2 days ago",
      read: true,
      image: "📚",
    },
    {
      id: 6,
      type: "connection",
      title: "David Lee accepted your connection",
      time: "3 days ago",
      read: true,
      image: "D",
    },
    {
      id: 7,
      type: "profile",
      title: "Your profile is getting noticed",
      preview: "Your profile appeared in 45 searches this week",
      time: "1 week ago",
      read: true,
      image: "📊",
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold ml-4">Notifications</h1>
        </div>

        <button className="text-blue-500 text-sm font-medium">Mark all read</button>
      </header>

      {/* Filter Tabs */}
      <div className="px-5 mb-4">
        <div className="flex overflow-x-auto hide-scrollbar space-x-2">
          <button className="bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
            All
          </button>

          <button className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
            Connections
          </button>
          <button className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
            Messages
          </button>
          <button className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
            Events
          </button>
          <button className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
            Jobs
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 px-5 overflow-y-auto">
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-4 ${!notification.read ? "border-l-4 border-blue-500" : ""}`}
            >
              <div className="flex">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                    typeof notification.image === "string" && notification.image.length === 1
                      ? "bg-blue-100 text-blue-600 font-medium"
                      : "bg-gray-100"
                  }`}
                >
                  {notification.image}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm ${!notification.read ? "font-bold" : "font-medium"}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-400 ml-2">{notification.time}</span>
                  </div>

                  {notification.preview && <p className="text-xs text-gray-500 mt-1">{notification.preview}</p>}

                  {notification.action && (
                    <button className="mt-2 bg-blue-500 text-white text-xs px-3 py-1 rounded-lg">
                      {notification.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// MessagesScreen Component
function MessagesScreen({ handleBack }: { handleBack: () => void }) {
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Sample conversations data
  const conversations = [
    {
      id: 1,
      name: "Alex Morgan",
      avatar: "A",
      lastMessage: "Hey, I'd love to connect about the product manager role",
      time: "10:32 AM",
      unread: 2,
      messages: [
        {
          id: 1,
          text: "Hey Richard, I saw your profile and I'm impressed with your product experience!",
          sender: "them",
          time: "10:15 AM",
        },
        {
          id: 2,
          text: "I'd love to connect about a Senior PM role we have open at my company.",
          sender: "them",
          time: "10:16 AM",
        },
        {
          id: 3,
          text: "Thanks Alex! I'd be happy to hear more about the opportunity.",
          sender: "me",
          time: "10:30 AM",
        },
        {
          id: 4,
          text: "Great! Are you available for a quick call tomorrow around 2 PM?",
          sender: "them",
          time: "10:32 AM",
        },
      ],
    },
    {
      id: 2,
      name: "Sarah Williams",
      avatar: "S",
      lastMessage: "The project timeline looks good. I'll review the details and get back to you.",
      time: "Yesterday",
      unread: 0,
      messages: [
        {
          id: 1,
          text: "Hi Richard, just following up on the project proposal we discussed.",
          sender: "them",
          time: "Yesterday, 3:45 PM",
        },
        {
          id: 2,
          text: "I've attached the updated timeline for your review.",
          sender: "them",
          time: "Yesterday, 3:46 PM",
        },
        {
          id: 3,
          text: "Thanks Sarah. I'll take a look and get back to you tomorrow.",
          sender: "me",
          time: "Yesterday, 4:30 PM",
        },
        {
          id: 4,
          text: "The project timeline looks good. I'll review the details and get back to you.",
          sender: "them",
          time: "Yesterday, 5:15 PM",
        },
      ],
    },
    {
      id: 3,
      name: "Michael Chen",
      avatar: "M",
      lastMessage: "Looking forward to our meeting next week!",
      time: "Monday",
      unread: 0,
      messages: [
        {
          id: 1,
          text: "Hi Richard, just confirming our meeting for next Tuesday at 11 AM.",
          sender: "them",
          time: "Monday, 2:20 PM",
        },
        { id: 2, text: "Yes, that works for me. I've added it to my calendar.", sender: "me", time: "Monday, 2:45 PM" },
        {
          id: 3,
          text: "Great! I'll send over some prep materials beforehand.",
          sender: "them",
          time: "Monday, 3:00 PM",
        },
        { id: 4, text: "Looking forward to our meeting next week!", sender: "them", time: "Monday, 3:01 PM" },
      ],
    },
    {
      id: 4,
      name: "Emily Johnson",
      avatar: "E",
      lastMessage: "The conference was amazing! So many great speakers and networking opportunities.",
      time: "Aug 15",
      unread: 0,
      messages: [
        {
          id: 1,
          text: "Hey Richard, did you attend the ProductCon conference last week?",
          sender: "them",
          time: "Aug 15, 10:15 AM",
        },
        { id: 2, text: "Yes, I was there on Thursday. Did you go as well?", sender: "me", time: "Aug 15, 11:30 AM" },
        { id: 3, text: "Yes! I attended all three days. It was fantastic.", sender: "them", time: "Aug 15, 12:45 PM" },
        {
          id: 4,
          text: "The conference was amazing! So many great speakers and networking opportunities.",
          sender: "them",
          time: "Aug 15, 12:46 PM",
        },
      ],
    },
  ]

  const [newMessage, setNewMessage] = useState("")

  const currentChat = conversations.find((conv) => conv.id === activeChat)

  return (
    <div className="flex flex-col h-full">
      {activeChat === null ? (
        <>
          {/* Messages List Header */}
          <header className="flex items-center justify-between px-5 pt-8 pb-4">
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <h1 className="text-xl font-bold ml-4">Messages</h1>
            </div>

            <button className="bg-blue-500 text-white p-2 rounded-full">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
            </button>
          </header>

          {/* Search */}
          <div className="px-5 mb-4">
            <div className="relative">
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
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
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 px-5 overflow-y-auto">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="bg-white rounded-xl p-3 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveChat(conversation.id)}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-600 mr-3 flex-shrink-0">
                    {conversation.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold truncate">{conversation.name}</h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{conversation.time}</span>
                    </div>

                    <p className="text-xs text-gray-500 truncate mt-1">{conversation.lastMessage}</p>
                  </div>

                  {conversation.unread > 0 && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white ml-2">
                      {conversation.unread}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Chat Header */}
          <header className="flex items-center px-5 pt-8 pb-4 border-b border-gray-200">
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              onClick={() => setActiveChat(null)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>

            <div className="flex items-center ml-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-600 mr-3">
                {currentChat?.avatar}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{currentChat?.name}</h3>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </div>

            <div className="ml-auto flex space-x-2">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  ></path>
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  ></path>
                </svg>
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 px-5 py-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {currentChat?.messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                  {message.sender !== "me" && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mr-2 flex-shrink-0">
                      {currentChat.avatar}
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] ${
                      message.sender === "me"
                        ? "bg-blue-500 text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl"
                        : "bg-white text-gray-800 rounded-tl-xl rounded-tr-xl rounded-br-xl border border-gray-200"
                    } px-3 py-2`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === "me" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="px-5 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  ></path>
                </svg>
              </button>

              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border-none focus:ring-0 bg-transparent px-3 py-2"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />

              <button
                className={`p-2 rounded-full ${
                  newMessage.trim() ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
                disabled={!newMessage.trim()}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ExperienceScreen Component
function ExperienceScreen({ handleBack }: { handleBack: () => void }) {
  const [selectedTab, setSelectedTab] = useState<"work" | "education" | "skills">("work")
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Initialize with sample data or load from localStorage
  const [experienceData, setExperienceData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("aether-experience-data")
      if (savedData) {
        return JSON.parse(savedData)
      }
    }

    // Sample experience data as fallback
    return {
      work: [
        {
          id: 1,
          role: "Senior Product Manager",
          company: "TechCorp International",
          location: "San Francisco, CA",
          period: "2020 - Present",
          description:
            "Leading cross-functional teams to develop and execute product strategy for enterprise SaaS platform. Managed product roadmap resulting in 35% revenue growth and 25% improvement in user engagement metrics.",
          achievements: [
            "Led redesign of core platform features, increasing user retention by 22%",
            "Implemented agile methodologies, reducing time-to-market by 40%",
            "Secured $2.5M in additional engineering resources through data-driven proposals",
          ],
          logo: "T",
        },
        {
          id: 2,
          role: "Product Manager",
          company: "InnovateSoft",
          location: "Boston, MA",
          period: "2017 - 2020",
          description:
            "Managed full product lifecycle for analytics suite serving 200+ enterprise clients. Collaborated with engineering, design, and sales teams to drive product development and go-to-market strategy.",
          achievements: [
            "Launched 3 major product features that generated $1.2M in incremental revenue",
            "Reduced customer churn by 15% through implementation of early warning system",
            "Established customer feedback program now used company-wide",
          ],
          logo: "I",
        },
        {
          id: 3,
          role: "Associate Product Manager",
          company: "DataViz Solutions",
          location: "New York, NY",
          period: "2015 - 2017",
          description:
            "Supported senior product managers in feature development for data visualization platform. Conducted market research, user interviews, and competitive analysis to inform product decisions.",
          achievements: [
            "Created user personas and journey maps now used across product teams",
            "Developed analytics dashboard used by C-suite for strategic planning",
            "Optimized onboarding flow, increasing activation rate by 28%",
          ],
          logo: "D",
        },
      ],
      education: [
        {
          id: 1,
          degree: "MBA, Technology Management",
          institution: "Stanford University",
          location: "Stanford, CA",
          period: "2015 - 2017",
          description:
            "Focused on product management, technology strategy, and entrepreneurship. Graduated with honors (3.8 GPA).",
          achievements: [
            "Led winning team in annual product innovation competition",
            "Published research paper on AI applications in product management",
            "Served as president of Product Management Club",
          ],
          logo: "S",
        },
        {
          id: 2,
          degree: "BS, Computer Science",
          institution: "University of California, Berkeley",
          location: "Berkeley, CA",
          period: "2011 - 2015",
          description:
            "Specialized in human-computer interaction and software engineering. Minor in Business Administration.",
          achievements: [
            "Dean's List for 6 consecutive semesters",
            "Developed mobile app for campus navigation used by 5,000+ students",
            "Teaching assistant for intro to programming courses",
          ],
          logo: "B",
        },
      ],
      skills: [
        {
          category: "Technical",
          items: [
            "SQL",
            "Python",
            "Data Analysis",
            "A/B Testing",
            "API Design",
            "Product Analytics",
            "Tableau",
            "Figma",
          ],
        },
        {
          category: "Business",
          items: [
            "Market Research",
            "Strategic Planning",
            "Competitive Analysis",
            "Revenue Modeling",
            "Pricing Strategy",
            "Go-to-Market Planning",
          ],
        },
        {
          category: "Leadership",
          items: [
            "Cross-functional Team Leadership",
            "Stakeholder Management",
            "Agile/Scrum",
            "Mentoring",
            "Roadmap Development",
            "User Interviews",
          ],
        },
      ],
      certifications: [
        {
          id: 1,
          name: "Certified Scrum Product Owner (CSPO)",
          issuer: "Scrum Alliance",
          date: "May 2022",
          logo: "📜",
        },
        {
          id: 2,
          name: "Product Analytics Certification",
          issuer: "Product School",
          date: "January 2023",
          logo: "📊",
        },
        {
          id: 3,
          name: "Strategic Leadership Program",
          issuer: "Harvard Business School Online",
          date: "September 2021",
          logo: "🎓",
        },
      ],
    }
  })

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aether-experience-data", JSON.stringify(experienceData))
    }
  }, [experienceData])

  // Function to add a new work experience
  const addWorkExperience = (newExperience: any) => {
    const newId = experienceData.work.length > 0 ? Math.max(...experienceData.work.map((item: any) => item.id)) + 1 : 1

    setExperienceData({
      ...experienceData,
      work: [
        {
          ...newExperience,
          id: newId,
          achievements: newExperience.achievements || [],
        },
        ...experienceData.work,
      ],
    })
    setShowAddModal(false)
  }

  // Function to add a new education
  const addEducation = (newEducation: any) => {
    const newId =
      experienceData.education.length > 0 ? Math.max(...experienceData.education.map((item: any) => item.id)) + 1 : 1

    setExperienceData({
      ...experienceData,
      education: [
        {
          ...newEducation,
          id: newId,
          achievements: newEducation.achievements || [],
        },
        ...experienceData.education,
      ],
    })
    setShowAddModal(false)
  }

  // Function to add a new certification
  const addCertification = (newCertification: any) => {
    const newId =
      experienceData.certifications.length > 0
        ? Math.max(...experienceData.certifications.map((item: any) => item.id)) + 1
        : 1

    setExperienceData({
      ...experienceData,
      certifications: [
        {
          ...newCertification,
          id: newId,
        },
        ...experienceData.certifications,
      ],
    })
    setShowAddModal(false)
  }

  // Function to add a new skill
  const addSkill = (category: string, skill: string) => {
    const updatedSkills = [...experienceData.skills]
    const categoryIndex = updatedSkills.findIndex((c) => c.category === category)

    if (categoryIndex >= 0) {
      // Category exists, add skill if it doesn't already exist
      if (!updatedSkills[categoryIndex].items.includes(skill)) {
        updatedSkills[categoryIndex].items.push(skill)
      }
    } else {
      // Create new category
      updatedSkills.push({
        category,
        items: [skill],
      })
    }

    setExperienceData({
      ...experienceData,
      skills: updatedSkills,
    })
    setShowAddModal(false)
  }

  // Function to delete an item
  const deleteItem = (type: "work" | "education" | "certification", id: number) => {
    if (type === "work") {
      setExperienceData({
        ...experienceData,
        work: experienceData.work.filter((item: any) => item.id !== id),
      })
    } else if (type === "education") {
      setExperienceData({
        ...experienceData,
        education: experienceData.education.filter((item: any) => item.id !== id),
      })
    } else if (type === "certification") {
      setExperienceData({
        ...experienceData,
        certifications: experienceData.certifications.filter((item: any) => item.id !== id),
      })
    }
  }

  // Function to delete a skill
  const deleteSkill = (category: string, skill: string) => {
    const updatedSkills = [...experienceData.skills]
    const categoryIndex = updatedSkills.findIndex((c) => c.category === category)

    if (categoryIndex >= 0) {
      updatedSkills[categoryIndex].items = updatedSkills[categoryIndex].items.filter((item: string) => item !== skill)

      // Remove category if empty
      if (updatedSkills[categoryIndex].items.length === 0) {
        updatedSkills.splice(categoryIndex, 1)
      }
    }

    setExperienceData({
      ...experienceData,
      skills: updatedSkills,
    })
  }

  // Function to update an existing work experience
  const updateWorkExperience = (updatedExperience: any) => {
    setExperienceData({
      ...experienceData,
      work: experienceData.work.map((item: any) => (item.id === updatedExperience.id ? updatedExperience : item)),
    })
    setIsEditing(false)
    setEditingItem(null)
  }

  // Function to update an existing education
  const updateEducation = (updatedEducation: any) => {
    setExperienceData({
      ...experienceData,
      education: experienceData.education.map((item: any) =>
        item.id === updatedEducation.id ? updatedEducation : item,
      ),
    })
    setIsEditing(false)
    setEditingItem(null)
  }

  // Function to update an existing certification
  const updateCertification = (updatedCertification: any) => {
    setExperienceData({
      ...experienceData,
      certifications: experienceData.certifications.map((item: any) =>
        item.id === updatedCertification.id ? updatedCertification : item,
      ),
    })
    setIsEditing(false)
    setEditingItem(null)
  }

  // Function to handle starting the edit process
  const handleEdit = (type: "work" | "education" | "certification", id: number) => {
    let itemToEdit

    if (type === "work") {
      itemToEdit = experienceData.work.find((item: any) => item.id === id)
    } else if (type === "education") {
      itemToEdit = experienceData.education.find((item: any) => item.id === id)
    } else if (type === "certification") {
      itemToEdit = experienceData.certifications.find((item: any) => item.id === id)
    }

    if (itemToEdit) {
      setEditingItem({ ...itemToEdit, type })
      setIsEditing(true)
    }
  }

  // Function to handle adding a new item
  const handleAdd = (type: "work" | "education" | "certification" | "skill") => {
    setEditingItem({ type })
    setShowAddModal(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold ml-4">Professional Experience</h1>
        </div>

        <button
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          onClick={() =>
            handleAdd(selectedTab === "skills" ? "skill" : selectedTab === "education" ? "education" : "work")
          }
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </header>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md ${
              selectedTab === "work" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setSelectedTab("work")}
          >
            Work
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md ${
              selectedTab === "education" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setSelectedTab("education")}
          >
            Education
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md ${
              selectedTab === "skills" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setSelectedTab("skills")}
          >
            Skills
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-5 overflow-y-auto pb-4">
        {selectedTab === "work" && (
          <div className="space-y-4">
            {experienceData.work.map((job: any) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm p-4 relative">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => handleEdit("work", job.id)}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => deleteItem("work", job.id)}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>

                <div className="flex">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl font-bold text-blue-600 mr-3 flex-shrink-0">
                    {job.logo}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold">{job.role}</h3>
                    <p className="text-sm text-gray-500">
                      {job.company} • {job.location}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{job.period}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-3">{job.description}</p>

                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Key Achievements:</p>
                  <ul className="space-y-1">
                    {job.achievements.map((achievement: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start">
                        <svg
                          className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-gray-600">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {experienceData.work.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <p className="text-gray-500 mb-4">No work experience added yet</p>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  onClick={() => handleAdd("work")}
                >
                  Add Work Experience
                </button>
              </div>
            )}
          </div>
        )}

        {selectedTab === "education" && (
          <div className="space-y-4">
            {experienceData.education.map((edu: any) => (
              <div key={edu.id} className="bg-white rounded-xl shadow-sm p-4 relative">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => handleEdit("education", edu.id)}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => deleteItem("education", edu.id)}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>

                <div className="flex">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl font-bold text-blue-600 mr-3 flex-shrink-0">
                    {edu.logo}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold">{edu.degree}</h3>
                    <p className="text-sm text-gray-500">
                      {edu.institution} • {edu.location}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{edu.period}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-3">{edu.description}</p>

                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Highlights:</p>
                  <ul className="space-y-1">
                    {edu.achievements.map((achievement: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start">
                        <svg
                          className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          ></path>
                        </svg>
                        <span className="text-gray-600">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {experienceData.education.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <p className="text-gray-500 mb-4">No education added yet</p>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  onClick={() => handleAdd("education")}
                >
                  Add Education
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Certifications</h3>
                <button
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => handleAdd("certification")}
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {experienceData.certifications.map((cert: any) => (
                  <div key={cert.id} className="flex items-center bg-gray-50 rounded-lg p-3 relative group">
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        onClick={() => handleEdit("certification", cert.id)}
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          ></path>
                        </svg>
                      </button>
                      <button
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        onClick={() => deleteItem("certification", cert.id)}
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    </div>

                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xl mr-3 flex-shrink-0">
                      {cert.logo}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{cert.name}</h4>
                      <p className="text-xs text-gray-500">
                        {cert.issuer} • {cert.date}
                      </p>
                    </div>
                  </div>
                ))}

                {experienceData.certifications.length === 0 && (
                  <div className="text-center py-3">
                    <p className="text-sm text-gray-500">No certifications added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === "skills" && (
          <div className="space-y-4">
            {experienceData.skills.map((skillGroup: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold">{skillGroup.category} Skills</h3>
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => handleAdd("skill")}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      ></path>
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill: string, itemIdx: number) => (
                    <span
                      key={itemIdx}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full group relative ${
                        skillGroup.category === "Technical"
                          ? "bg-blue-50 text-blue-600"
                          : skillGroup.category === "Business"
                            ? "bg-green-50 text-green-600"
                            : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {skill}
                      <button
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteSkill(skillGroup.category, skill)}
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {experienceData.skills.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <p className="text-gray-500 mb-4">No skills added yet</p>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  onClick={() => handleAdd("skill")}
                >
                  Add Skills
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-base font-semibold mb-3">Strengths Assessment</h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Strategic Planning</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Product Vision</span>
                    <span className="text-sm font-medium">88%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Data Analysis</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Cross-functional Leadership</span>
                    <span className="text-sm font-medium">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "90%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Technical Communication</span>
                    <span className="text-sm font-medium">83%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "83%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isEditing || showAddModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {isEditing ? "Edit" : "Add"}{" "}
                  {editingItem?.type === "work"
                    ? "Work Experience"
                    : editingItem?.type === "education"
                      ? "Education"
                      : editingItem?.type === "certification"
                        ? "Certification"
                        : "Skill"}
                </h3>
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={() => {
                    setIsEditing(false)
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Work Experience Form */}
              {editingItem?.type === "work" && (
                <WorkExperienceForm
                  initialData={editingItem}
                  onSubmit={isEditing ? updateWorkExperience : addWorkExperience}
                  onCancel={() => {
                    setIsEditing(false)
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                />
              )}

              {/* Education Form */}
              {editingItem?.type === "education" && (
                <EducationForm
                  initialData={editingItem}
                  onSubmit={isEditing ? updateEducation : addEducation}
                  onCancel={() => {
                    setIsEditing(false)
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                />
              )}

              {/* Certification Form */}
              {editingItem?.type === "certification" && (
                <CertificationForm
                  initialData={editingItem}
                  onSubmit={isEditing ? updateCertification : addCertification}
                  onCancel={() => {
                    setIsEditing(false)
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                />
              )}

              {/* Skill Form */}
              {editingItem?.type === "skill" && (
                <SkillForm
                  categories={experienceData.skills.map((s: any) => s.category)}
                  onSubmit={(category, skill) => {
                    addSkill(category, skill)
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                  onCancel={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Work Experience Form Component
function WorkExperienceForm({ initialData, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    id: initialData?.id || 0,
    role: initialData?.role || "",
    company: initialData?.company || "",
    location: initialData?.location || "",
    period: initialData?.period || "",
    description: initialData?.description || "",
    achievements: initialData?.achievements || [""],
    logo: initialData?.logo || "",
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...formData.achievements]
    newAchievements[index] = value
    setFormData({
      ...formData,
      achievements: newAchievements,
    })
  }

  const addAchievement = () => {
    setFormData({
      ...formData,
      achievements: [...formData.achievements, ""],
    })
  }

  const removeAchievement = (index: number) => {
    const newAchievements = [...formData.achievements]
    newAchievements.splice(index, 1)
    setFormData({
      ...formData,
      achievements: newAchievements,
    })
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Filter out empty achievements
    const filteredAchievements = formData.achievements.filter((a) => a.trim() !== "")
    onSubmit({
      ...formData,
      achievements: filteredAchievements,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
          <input
            type="text"
            name="period"
            value={formData.period}
            onChange={handleChange}
            placeholder="e.g., 2020 - Present"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Single Character)</label>
          <input
            type="text"
            name="logo"
            value={formData.logo}
            onChange={handleChange}
            maxLength={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Achievements</label>
            <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={addAchievement}>
              + Add Achievement
            </button>
          </div>

          {formData.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={achievement}
                onChange={(e) => handleAchievementChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter achievement"
              />
              {formData.achievements.length > 1 && (
                <button
                  type="button"
                  className="ml-2 p-1.5 text-gray-500 hover:text-red-500"
                  onClick={() => removeAchievement(index)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
            {initialData?.id ? "Update" : "Add"} Experience
          </button>
        </div>
      </div>
    </form>
  )
}

// Education Form Component
function EducationForm({ initialData, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    id: initialData?.id || 0,
    degree: initialData?.degree || "",
    institution: initialData?.institution || "",
    location: initialData?.location || "",
    period: initialData?.period || "",
    description: initialData?.description || "",
    achievements: initialData?.achievements || [""],
    logo: initialData?.logo || "",
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...formData.achievements]
    newAchievements[index] = value
    setFormData({
      ...formData,
      achievements: newAchievements,
    })
  }

  const addAchievement = () => {
    setFormData({
      ...formData,
      achievements: [...formData.achievements, ""],
    })
  }

  const removeAchievement = (index: number) => {
    const newAchievements = [...formData.achievements]
    newAchievements.splice(index, 1)
    setFormData({
      ...formData,
      achievements: newAchievements,
    })
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Filter out empty achievements
    const filteredAchievements = formData.achievements.filter((a) => a.trim() !== "")
    onSubmit({
      ...formData,
      achievements: filteredAchievements,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
          <input
            type="text"
            name="degree"
            value={formData.degree}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
          <input
            type="text"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
          <input
            type="text"
            name="period"
            value={formData.period}
            onChange={handleChange}
            placeholder="e.g., 2015 - 2019"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Single Character)</label>
          <input
            type="text"
            name="logo"
            value={formData.logo}
            onChange={handleChange}
            maxLength={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Highlights</label>
            <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={addAchievement}>
              + Add Highlight
            </button>
          </div>

          {formData.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={achievement}
                onChange={(e) => handleAchievementChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter highlight"
              />
              {formData.achievements.length > 1 && (
                <button
                  type="button"
                  className="ml-2 p-1.5 text-gray-500 hover:text-red-500"
                  onClick={() => removeAchievement(index)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
            {initialData?.id ? "Update" : "Add"} Education
          </button>
        </div>
      </div>
    </form>
  )
}

// Certification Form Component
function CertificationForm({ initialData, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    id: initialData?.id || 0,
    name: initialData?.name || "",
    issuer: initialData?.issuer || "",
    date: initialData?.date || "",
    logo: initialData?.logo || "",
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
          <input
            type="text"
            name="issuer"
            value={formData.issuer}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued</label>
          <input
            type="text"
            name="date"
            value={formData.date}
            onChange={handleChange}
            placeholder="e.g., January 2023"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Single Character)</label>
          <input
            type="text"
            name="logo"
            value={formData.logo}
            onChange={handleChange}
            maxLength={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
            {initialData?.id ? "Update" : "Add"} Certification
          </button>
        </div>
      </div>
    </form>
  )
}

// Skill Form Component
function SkillForm({ categories, onSubmit, onCancel }: any) {
  const [category, setCategory] = useState(categories[0] || "")
  const [newCategory, setNewCategory] = useState("")
  const [skill, setSkill] = useState("")

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSubmit(category, skill)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          {categories.length > 0 ? (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Enter new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
            Add Skill
          </button>
        </div>
      </div>
    </form>
  )
}

const FinancialsScreen = ({ handleBack }: { handleBack: () => void }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Financials</h1>
      </header>

      {/* Coming Soon */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="text-6xl mb-4">💰</div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-center">We're working hard to bring you this feature. Check back soon!</p>
      </div>

      {/* Back Button */}
      <div className="px-5 pb-6">
        <button className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg" onClick={handleBack}>
          Go Back Home
        </button>
      </div>
    </div>
  )
}

const LocationsScreen = ({ handleBack }: { handleBack: () => void }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Locations</h1>
      </header>

      {/* Coming Soon */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="text-6xl mb-4">📍</div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-center">We're working hard to bring you this feature. Check back soon!</p>
      </div>

      {/* Back Button */}
      <div className="px-5 pb-6">
        <button className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg" onClick={handleBack}>
          Go Back Home
        </button>
      </div>
    </div>
  )
}

const PremiumScreen = ({ handleBack }: { handleBack: () => void }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={handleBack}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Premium</h1>
      </header>

      {/* Coming Soon */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="text-6xl mb-4">💎</div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-center">We're working hard to bring you this feature. Check back soon!</p>
      </div>

      {/* Back Button */}
      <div className="px-5 pb-6">
        <button className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg" onClick={handleBack}>
          Go Back Home
        </button>
      </div>
    </div>
  )
}