import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { apiRequest } from "@/lib/queryClient"
import { Loader2 } from "lucide-react"

interface QuizScreenProps {
  handleBack: (data?: any) => void
}

interface QuizQuestion {
  id: number
  text: string
  options: string[]
}

interface CareerCategory {
  name: string
  score: number
  color: string
  description: string
  careers: string[]
}

export default function QuizScreen({ handleBack }: QuizScreenProps) {
  const { toast } = useToast()
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [progress, setProgress] = useState(10)
  const [aiAnalysis, setAiAnalysis] = useState<string>("")
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<string>("")
  const [careerSummary, setCareerSummary] = useState<string>("")
  
  const questions: QuizQuestion[] = [
    {
      id: 1,
      text: "When solving complex problems in a professional setting, I prefer to:",
      options: [
        "Analyze data and find patterns systematically",
        "Collaborate with others to brainstorm creative solutions",
        "Consider the human/social impact of potential solutions",
        "Focus on practical, immediate solutions that can be implemented quickly"
      ]
    },
    {
      id: 2,
      text: "In a high-pressure deadline situation, my most valuable contribution would be:",
      options: [
        "Creating an organized plan with clear milestones",
        "Finding innovative approaches or shortcuts to complete the work",
        "Maintaining team morale and managing stress levels",
        "Ensuring quality standards are met despite time constraints"
      ]
    },
    {
      id: 3,
      text: "When learning new professional skills, I'm most engaged when:",
      options: [
        "Mastering technical details and specifications",
        "Exploring creative applications of the knowledge",
        "Understanding how it will help people or improve lives",
        "Seeing clear practical applications to real-world problems"
      ]
    },
    {
      id: 4,
      text: "My ideal work environment would include:",
      options: [
        "Structure, clear processes, and opportunities for focused concentration",
        "Freedom to innovate, experiment, and reimagine possibilities",
        "Collaborative team dynamics and meaningful human connections",
        "Practical challenges with tangible results I can see and measure"
      ]
    },
    {
      id: 5,
      text: "When receiving feedback on my work, I most value hearing about:",
      options: [
        "Logical inconsistencies or areas needing more precise analysis",
        "Opportunities to approach problems more innovatively",
        "How my work affects others or could better address human needs",
        "Specific improvements to make my work more efficient or effective"
      ]
    },
    {
      id: 6,
      text: "My professional communication style tends to be:",
      options: [
        "Precise, detailed, and fact-based",
        "Expressive, visual, and future-oriented",
        "Empathetic, considerate, and focused on relationship-building",
        "Direct, action-oriented, and results-focused"
      ]
    },
    {
      id: 7,
      text: "When evaluating career opportunities, I prioritize:",
      options: [
        "Intellectual challenge and opportunities to solve complex problems",
        "Creative freedom and the chance to innovate",
        "Making a positive difference in people's lives",
        "Clear advancement paths and tangible rewards"
      ]
    },
    {
      id: 8,
      text: "My approach to professional decision-making typically involves:",
      options: [
        "Detailed analysis of all variables and potential outcomes",
        "Considering novel approaches that others might overlook",
        "Weighing the impact on stakeholders and team dynamics",
        "Focusing on what will produce the most immediate practical results"
      ]
    },
    {
      id: 9,
      text: "In my ideal leadership role, I would focus on:",
      options: [
        "Creating systems and frameworks that ensure excellence",
        "Inspiring innovation and challenging conventional thinking",
        "Developing people and building strong, supportive cultures",
        "Setting clear goals and driving consistent achievement"
      ]
    }
  ]

  const totalQuestions = questions.length

  useEffect(() => {
    // Update progress bar when current question changes
    setProgress((currentQuestion / totalQuestions) * 100)
  }, [currentQuestion, totalQuestions])

  const handleOptionSelect = (option: string) => {
    setSelectedOptions({
      ...selectedOptions,
      [currentQuestion]: option
    })
  }

  const handleNextQuestion = () => {
    if (!selectedOptions[currentQuestion]) {
      toast({
        title: "Selection required",
        description: "Please select an option before proceeding.",
        variant: "destructive"
      })
      return
    }

    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Show results and generate AI analysis
      setShowResults(true)
      
      // Mark the quiz as completed in sessionStorage
      try {
        sessionStorage.setItem('quizCompleted', 'true')
        console.log('Quiz marked as completed in sessionStorage')
      } catch (error) {
        console.error('Error storing quiz completion status:', error)
      }
      
      fetchAiAnalysis()
    }
  }
  
  // Fetch career analysis from Gemini AI
  const fetchAiAnalysis = async () => {
    try {
      setIsLoadingAnalysis(true)
      setAiError(null)
      
      const careerData = generateCareerData()
      
      // First get detailed analysis
      const analysisResponse = await apiRequest('POST', '/api/career-analysis', { careerData })
      const analysisData = await analysisResponse.json()
      setAnalysisResult(analysisData.analysis)
      
      // Then get summary 
      const summaryResponse = await apiRequest('POST', '/api/career-summary', { careerData })
      const summaryData = await summaryResponse.json()
      setCareerSummary(summaryData.analysis)
      
      // Combine both analyses
      const fullAnalysis = analysisData.analysis + "\n\n" + summaryData.analysis
      
      // Use the combined analysis
      setAiAnalysis(fullAnalysis)
    } catch (error) {
      console.error('Error fetching AI career analysis:', error)
      setAiError('Unable to generate AI career analysis. Please try again later.')
      toast({
        title: 'AI Analysis Error',
        description: 'Failed to generate career insight. The AI service may be unavailable.',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingAnalysis(false)
    }
  }

  // Calculate career category scores based on selected options
  const calculateCareerScores = () => {
    const selectedValues = Object.values(selectedOptions)
    
    // Initialize scores for each category
    let analyticalScore = 0
    let creativeScore = 0
    let socialScore = 0
    let practicalScore = 0
    
    // Count responses in each category
    selectedValues.forEach((value, index) => {
      const optionIndex = questions[index]?.options.indexOf(value)
      if (optionIndex === 0) analyticalScore++  // First option - analytical
      if (optionIndex === 1) creativeScore++    // Second option - creative
      if (optionIndex === 2) socialScore++      // Third option - social
      if (optionIndex === 3) practicalScore++   // Fourth option - practical
    })
    
    // Calculate percentages (rounded to nearest integer)
    const total = analyticalScore + creativeScore + socialScore + practicalScore
    const analyticalPercent = Math.round((analyticalScore / total) * 100)
    const creativePercent = Math.round((creativeScore / total) * 100)
    const socialPercent = Math.round((socialScore / total) * 100)
    const practicalPercent = 100 - analyticalPercent - creativePercent - socialPercent
    
    return {
      analytical: analyticalPercent,
      creative: creativePercent,
      social: socialPercent,
      practical: practicalPercent,
      dominantType: getDominantType(analyticalPercent, creativePercent, socialPercent, practicalPercent)
    }
  }
  
  // Determine the dominant career type
  const getDominantType = (analytical: number, creative: number, social: number, practical: number) => {
    const max = Math.max(analytical, creative, social, practical)
    if (max === analytical) return "analytical"
    if (max === creative) return "creative"
    if (max === social) return "social"
    return "practical"
  }

  const generateCareerData = () => {
    const scores = calculateCareerScores()
    
    const careerCategories: CareerCategory[] = [
      {
        name: "Analytical",
        score: scores.analytical,
        color: "#3366CC",
        description: "You excel at logical thinking, data analysis, and systematic problem-solving.",
        careers: [
          "Data Scientist/Analyst",
          "Software Engineer",
          "Research Scientist",
          "Financial Analyst",
          "Systems Architect",
          "Business Intelligence Specialist"
        ]
      },
      {
        name: "Creative",
        score: scores.creative,
        color: "#DC3912",
        description: "You thrive on innovation, original thinking, and developing novel solutions.",
        careers: [
          "UX/UI Designer",
          "Marketing Strategist",
          "Content Creator",
          "Product Designer",
          "Creative Director",
          "Innovation Consultant"
        ]
      },
      {
        name: "Social",
        score: scores.social,
        color: "#FF9900",
        description: "You're skilled at understanding people, building relationships, and fostering collaboration.",
        careers: [
          "Human Resources Specialist",
          "Counselor/Therapist",
          "Community Manager",
          "Customer Success Manager",
          "Training & Development",
          "Healthcare Administrator"
        ]
      },
      {
        name: "Practical",
        score: scores.practical,
        color: "#109618",
        description: "You focus on tangible results, efficiency, and implementing actionable solutions.",
        careers: [
          "Project Manager",
          "Operations Manager",
          "Quality Assurance Specialist",
          "Supply Chain Manager",
          "Logistics Coordinator",
          "Construction Manager"
        ]
      }
    ]
    
    // Determine primary and secondary types
    const sortedCategories = [...careerCategories].sort((a, b) => b.score - a.score)
    const primaryType = sortedCategories[0]
    const secondaryType = sortedCategories[1]
    
    // Create hybrid career recommendations based on top two types
    const hybridCareers = getHybridCareers(primaryType.name.toLowerCase(), secondaryType.name.toLowerCase())
    
    // Format data for the pie chart
    const chartData = careerCategories.map(category => ({
      name: category.name,
      value: category.score,
      color: category.color
    }))
    
    return {
      categories: careerCategories,
      chartData,
      primaryType,
      secondaryType,
      hybridCareers,
      dominantType: scores.dominantType
    }
  }
  
  // Get hybrid career recommendations based on top two types
  const getHybridCareers = (primary: string, secondary: string) => {
    const combinations: Record<string, string[]> = {
      "analytical_creative": [
        "Machine Learning Engineer",
        "Data Visualization Specialist",
        "Algorithmic Trader",
        "Computational Linguist",
        "Quantitative UX Researcher"
      ],
      "analytical_social": [
        "People Analytics Manager",
        "Organizational Psychologist", 
        "Healthcare Data Analyst",
        "Educational Assessment Specialist",
        "Economic Policy Researcher"
      ],
      "analytical_practical": [
        "Systems Optimization Engineer",
        "Financial Risk Analyst",
        "Quality Systems Manager",
        "Operations Research Analyst",
        "Business Process Engineer"
      ],
      "creative_social": [
        "Experience Designer",
        "Social Media Strategist",
        "Organizational Culture Consultant",
        "Design Thinking Facilitator",
        "Communications Director"
      ],
      "creative_practical": [
        "Product Manager",
        "Design Engineer",
        "User Experience Architect",
        "Growth Hacker",
        "Creative Operations Manager"
      ],
      "social_practical": [
        "Change Management Specialist",
        "Customer Experience Director",
        "Healthcare Program Manager",
        "Diversity & Inclusion Manager",
        "Community Operations Manager"
      ]
    }
    
    // Find the right combination (order doesn't matter)
    const key1 = `${primary}_${secondary}`
    const key2 = `${secondary}_${primary}`
    
    return combinations[key1] || combinations[key2] || []
  }

  const handleViewDetails = async () => {
    const results = generateCareerData()
    
    // Make sure quiz completion is stored in sessionStorage
    try {
      sessionStorage.setItem('quizCompleted', 'true')
    } catch (error) {
      console.error('Error storing quiz completion status:', error)
    }
    
    try {
      // Prepare quiz results data with ALL needed properties
      const quizData = {
        primaryType: {
          name: results.primaryType?.name || '',
          score: results.primaryType?.score || 0,
          description: results.primaryType?.description || '',
          careers: results.primaryType?.careers || []
        },
        secondaryType: {
          name: results.secondaryType?.name || '',
          score: results.secondaryType?.score || 0,
          description: results.secondaryType?.description || '',
          careers: results.secondaryType?.careers || []
        },
        categories: results.categories || [],
        hybridCareers: results.hybridCareers || [],
        dominantType: results.primaryType?.name || '',
        analysis: analysisResult,
        summary: careerSummary,
        savedAt: new Date().toISOString(),
        // Additional data for completeness
        chartData: results.chartData || [],
        strengths: [results.primaryType?.description || '']
      }
      
      // ALWAYS save to localStorage FIRST to ensure data persistence
      // This is critical for when server storage fails
      try {
        localStorage.setItem('quizResults', JSON.stringify(quizData))
        console.log("✅ Quiz results GUARANTEED saved to localStorage first")
        
        // Set a timestamp to track when results were last saved
        localStorage.setItem('quizResultsTimestamp', new Date().toISOString())
        
        // Also store in sessionStorage for redundancy
        sessionStorage.setItem('quizResults', JSON.stringify(quizData))
      } catch (localError) {
        console.error("Failed to save quiz results to localStorage:", localError)
      }
      
      console.log("Saving quiz results to server:", quizData)
      
      try {
        // Save quiz results to the database via new API endpoint
        const response = await apiRequest('POST', '/api/quiz/results', quizData)
        
        if (response.ok) {
          const responseData = await response.json()
          console.log("Save response from server:", responseData)
          
          toast({
            title: "Success!",
            description: "Your assessment results have been saved to your profile.",
          })
          
          // Pass quiz data back for navigation, redundantly set to ensure quizResults are never lost
          handleBack(quizData)
        } else {
          // If response is 401 Unauthorized, we need to inform the user
          if (response.status === 401) {
            toast({
              title: "Authentication Required",
              description: "Please log in first to save results to your profile.",
              variant: "destructive",
            })
            // Store in localStorage for backup
            try {
              localStorage.setItem('quizResults', JSON.stringify(quizData))
              console.log("Quiz results saved to localStorage since user is not authenticated")
            } catch (err) {
              console.error("Could not save quiz results to localStorage:", err)
            }
            
            // Pass quiz data back for navigation
            handleBack(quizData)
            return
          }
          
          const errorData = await response.text()
          console.error("Error response:", errorData)
          
          toast({
            title: "Error",
            description: "Failed to save results to your profile. Please try again.",
            variant: "destructive",
          })
          
          // Store in localStorage for backup
          try {
            localStorage.setItem('quizResults', JSON.stringify(quizData))
            console.log("Quiz results saved to localStorage despite API error")
          } catch (err) {
            console.error("Could not save quiz results to localStorage:", err)
          }
          
          // Pass quiz data back for navigation
          handleBack(quizData)
        }
      } catch (apiError) {
        console.error("API call error:", apiError)
        toast({
          title: "Connection Error",
          description: "Could not connect to the server. Please try again later.",
          variant: "destructive",
        })
        
        // Store in localStorage for backup
        try {
          // Create quiz data to prepare for storage
          const quizData = {
            primaryType: {
              name: results.primaryType?.name || '',
              score: results.primaryType?.score || 0,
              description: results.primaryType?.description || '',
              careers: results.primaryType?.careers || []
            },
            secondaryType: {
              name: results.secondaryType?.name || '',
              score: results.secondaryType?.score || 0,
              description: results.secondaryType?.description || '',
              careers: results.secondaryType?.careers || []
            },
            categories: results.categories || [],
            hybridCareers: results.hybridCareers || [],
            dominantType: results.primaryType?.name || '',
            savedAt: new Date().toISOString()
          }
          localStorage.setItem('quizResults', JSON.stringify(quizData))
          console.log("Quiz results saved to localStorage as fallback")
          
          // Pass the quiz data back for navigation
          handleBack(quizData)
        } catch (err) {
          console.error("Could not save quiz results to localStorage:", err)
          // Fallback to just passing raw results
          handleBack(results)
        }
      }
    } catch (error) {
      console.error("Error in handleViewDetails:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      })
    }
    // No need for handleBack here as it's already called in the proper catch blocks
  }

  const handleReturnHome = () => {
    const results = generateCareerData()
    
    // Create and store formatted quiz data
    try {
      const quizData = {
        primaryType: {
          name: results.primaryType?.name || '',
          score: results.primaryType?.score || 0,
          description: results.primaryType?.description || '',
          careers: results.primaryType?.careers || []
        },
        secondaryType: {
          name: results.secondaryType?.name || '',
          score: results.secondaryType?.score || 0,
          description: results.secondaryType?.description || '',
          careers: results.secondaryType?.careers || []
        },
        categories: results.categories || [],
        hybridCareers: results.hybridCareers || [],
        dominantType: results.primaryType?.name || '',
        savedAt: new Date().toISOString(),
        // Add chart data and other fields for completeness
        chartData: results.chartData || [],
        strengths: [results.primaryType?.description || ''],
        analysis: analysisResult,
        summary: careerSummary
      }
      
      // Save to both localStorage and sessionStorage for redundant persistence
      localStorage.setItem('quizResults', JSON.stringify(quizData))
      sessionStorage.setItem('quizResults', JSON.stringify(quizData))
      localStorage.setItem('quizResultsTimestamp', new Date().toISOString())
      console.log("✅ Quiz results GUARANTEED saved to localStorage from Return Home button")
      
      // Also try to save to server in the background
      try {
        // Don't await this call - let it happen in the background
        apiRequest('POST', '/api/quiz/results', quizData)
          .then(response => {
            if (response.ok) {
              console.log("Successfully saved quiz results to server in background")
            }
          })
          .catch(error => {
            console.error("Background save to server failed, but localStorage save successful:", error)
          })
      } catch (apiError) {
        console.error("Failed to initiate background save to server:", apiError)
      }
      
      // Pass structured data back
      handleBack(quizData)
    } catch (err) {
      console.error("Could not prepare quiz data in handleReturnHome:", err)
      // Fallback to raw results
      handleBack(results)
    }
  }

  const renderPieChart = () => {
    const data = generateCareerData().chartData
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const renderCareerRecommendations = () => {
    const results = generateCareerData()
    const primaryType = results.primaryType
    const secondaryType = results.secondaryType
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">Primary Career Dimension: {primaryType.name}</h3>
          <p className="text-sm text-gray-600">{primaryType.description}</p>
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700">Recommended Careers:</h4>
            <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
              {primaryType.careers.slice(0, 3).map((career, idx) => (
                <li key={idx}>{career}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-semibold text-gray-800">Combined with {secondaryType.name}</h3>
          <p className="text-sm text-gray-600">Your secondary dimension enhances your primary strengths, opening up these hybrid career paths:</p>
          <div className="mt-2">
            <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
              {results.hybridCareers.slice(0, 3).map((career, idx) => (
                <li key={idx}>{career}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 mobile-header flex items-center">
        <button className="back-button p-2 rounded-full hover:bg-gray-100 transition-colors" onClick={() => {
          if (showResults) {
            // If results are showing, generate and store the data before going back
            try {
              const results = generateCareerData();
              const quizData = {
                primaryType: {
                  name: results.primaryType?.name || '',
                  score: results.primaryType?.score || 0,
                  description: results.primaryType?.description || '',
                  careers: results.primaryType?.careers || []
                },
                secondaryType: {
                  name: results.secondaryType?.name || '',
                  score: results.secondaryType?.score || 0,
                  description: results.secondaryType?.description || '',
                  careers: results.secondaryType?.careers || []
                },
                categories: results.categories || [],
                hybridCareers: results.hybridCareers || [],
                dominantType: results.primaryType?.name || '',
                savedAt: new Date().toISOString(),
                // Add chart data and other fields for completeness
                chartData: results.chartData || [],
                strengths: [results.primaryType?.description || ''],
                analysis: analysisResult,
                summary: careerSummary
              };
              
              // Save to multiple storage mechanisms for redundancy
              localStorage.setItem('quizResults', JSON.stringify(quizData));
              sessionStorage.setItem('quizResults', JSON.stringify(quizData));
              localStorage.setItem('quizResultsTimestamp', new Date().toISOString());
              console.log("✅ Quiz results GUARANTEED saved to localStorage from back button");
              
              // Also try to save to server in the background
              try {
                // Don't await this call - let it happen in the background
                apiRequest('POST', '/api/quiz/results', quizData)
                  .then(response => {
                    if (response.ok) {
                      console.log("Successfully saved quiz results to server in background from back button")
                    }
                  })
                  .catch(error => {
                    console.error("Background save to server failed, but localStorage save successful from back button:", error)
                  })
              } catch (apiError) {
                console.error("Failed to initiate background save to server from back button:", apiError)
              }
              
              handleBack(quizData);
            } catch (err) {
              console.error("Could not save quiz results from back button:", err);
              
              // Try to load from localStorage as a fallback before returning home
              try {
                const savedResults = localStorage.getItem('quizResults');
                if (savedResults) {
                  console.log("Using previously saved quiz results from localStorage instead");
                  const parsedResults = JSON.parse(savedResults);
                  handleBack(parsedResults);
                  return;
                }
              } catch (loadError) {
                console.error("Failed to load backup quiz results:", loadError);
              }
              
              handleBack();
            }
          } else {
            // Check if we should preserve previously saved quiz results
            try {
              const savedResults = localStorage.getItem('quizResults');
              if (savedResults) {
                console.log("Found saved quiz results in localStorage");
                const parsedResults = JSON.parse(savedResults);
                handleBack(parsedResults);
                return;
              }
            } catch (error) {
              console.error("Error checking localStorage for quiz results:", error);
            }
            
            // If no saved results, just go back
            handleBack();
          }
        }}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold">Career Assessment</h1>
      </header>

      {/* Quiz Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <Progress value={progress} className="w-full h-2 mb-6" />

        {!showResults ? (
          <div>
            {questions.map((question) => (
              <div key={question.id} className={`${currentQuestion === question.id ? 'block' : 'hidden'}`}>
                <h2 className="text-lg font-medium mb-4">{question.text}</h2>
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div 
                      key={index}
                      className={`bg-white rounded-lg p-4 border-2 ${
                        selectedOptions[question.id] === option 
                          ? 'border-blue-500' 
                          : 'border-gray-200'
                      } cursor-pointer hover:border-blue-500`}
                      onClick={() => handleOptionSelect(option)}
                    >
                      <p>{option}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-center">Career Assessment Complete!</h2>
              <p className="text-gray-600 mb-6 text-center">Based on your responses, we've identified your career dimension profile:</p>
              
              {/* Pie Chart */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">Your Career Dimension Profile</h3>
                {renderPieChart()}
              </div>
              
              {/* Career Recommendations */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-blue-800 mb-3">Career Recommendations</h3>
                {renderCareerRecommendations()}
              </div>
              
              {/* AI Career Analysis */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <h3 className="text-lg font-bold text-purple-800">AI Career Analysis</h3>
                  {isLoadingAnalysis && (
                    <div className="ml-3">
                      <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {aiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p className="text-sm">{aiError}</p>
                  </div>
                )}
                
                {!isLoadingAnalysis && !aiError && aiAnalysis ? (
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {aiAnalysis}
                  </div>
                ) : !isLoadingAnalysis && !aiError ? (
                  <p className="text-sm text-gray-500 italic">Generating detailed career insights using AI...</p>
                ) : null}
              </div>
              
              <Button
                onClick={handleViewDetails}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg mb-3"
              >
                Save to Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleReturnHome}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg"
              >
                Return to Home
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {!showResults && (
        <footer className="px-5 py-4">
          <Button
            onClick={handleNextQuestion}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg"
          >
            {currentQuestion < totalQuestions ? "Next Question" : "Complete Assessment"}
          </Button>
        </footer>
      )}
    </div>
  )
}
