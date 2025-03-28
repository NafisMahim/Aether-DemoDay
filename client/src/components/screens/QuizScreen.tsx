import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface QuizScreenProps {
  handleBack: (data?: any) => void
}

interface QuizQuestion {
  id: number
  text: string
  options: string[]
}

export default function QuizScreen({ handleBack }: QuizScreenProps) {
  const { toast } = useToast()
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [progress, setProgress] = useState(25)
  
  const questions: QuizQuestion[] = [
    {
      id: 1,
      text: "I prefer to work on projects:",
      options: [
        "Independently, at my own pace",
        "Collaboratively, with a team",
        "A mix of both, depending on the task",
        "Leading a team of people"
      ]
    },
    {
      id: 2,
      text: "When making decisions, I typically:",
      options: [
        "Trust my instincts and feelings",
        "Analyze all available data",
        "Consider the impact on others",
        "Weigh pros and cons carefully"
      ]
    },
    {
      id: 3,
      text: "I find the most satisfaction in:",
      options: [
        "Solving complex problems",
        "Helping others achieve their goals",
        "Creating something innovative",
        "Learning and growing my skills"
      ]
    },
    {
      id: 4,
      text: "When facing a challenge, I'm most likely to:",
      options: [
        "Break it down into manageable steps",
        "Look for creative, unconventional solutions",
        "Seek advice from others with experience",
        "Research thoroughly before acting"
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
      // Show results
      setShowResults(true)
    }
  }

  const determinePersonalityType = () => {
    // Simple algorithm to determine personality type based on answers
    const selectedValues = Object.values(selectedOptions)
    
    if (selectedValues.includes("Analyze all available data") && 
        selectedValues.includes("Solving complex problems")) {
      return "Analytical Innovator"
    } else if (selectedValues.includes("Consider the impact on others") && 
              selectedValues.includes("Helping others achieve their goals")) {
      return "Empathetic Facilitator"
    } else if (selectedValues.includes("Creating something innovative") && 
              selectedValues.includes("Look for creative, unconventional solutions")) {
      return "Creative Problem-Solver"
    } else if (selectedValues.includes("Leading a team of people")) {
      return "Strategic Leader"
    } else {
      return "Balanced Professional"
    }
  }

  const generateResults = () => {
    const personalityType = determinePersonalityType()
    let description, strengths, weaknesses
    
    switch (personalityType) {
      case "Analytical Innovator":
        description = "You combine careful analysis with creative thinking to solve problems effectively."
        strengths = ["Problem solving", "Creative thinking", "Attention to detail"]
        weaknesses = ["May overthink decisions", "Perfectionism", "Occasional analysis paralysis"]
        break
      case "Empathetic Facilitator":
        description = "You excel at understanding others' needs and helping them succeed."
        strengths = ["Emotional intelligence", "Collaboration", "Communication"]
        weaknesses = ["May prioritize others over self", "Conflict avoidance", "Decision fatigue"]
        break
      case "Creative Problem-Solver":
        description = "You think outside the box and create innovative solutions to challenges."
        strengths = ["Innovation", "Adaptability", "Vision"]
        weaknesses = ["May struggle with routine", "Inconsistency", "Focus challenges"]
        break
      case "Strategic Leader":
        description = "You have a natural ability to guide others and create a compelling vision."
        strengths = ["Leadership", "Strategic thinking", "Decision-making"]
        weaknesses = ["Impatience", "Delegation struggles", "Work-life balance"]
        break
      default:
        description = "You have a well-rounded approach to work and life, adapting to different situations."
        strengths = ["Adaptability", "Balance", "Versatility"]
        weaknesses = ["Jack of all trades", "Indecisiveness", "Identity questions"]
    }
    
    return {
      personalityType,
      description,
      strengths,
      weaknesses
    }
  }

  const handleViewDetails = () => {
    const results = generateResults()
    handleBack(results)
  }

  const handleReturnHome = () => {
    const results = generateResults()
    handleBack(results)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center">
        <button className="mr-3" onClick={() => handleBack()}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold">Personality Quiz</h1>
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
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-gray-600 mb-4">Based on your responses, you appear to be:</p>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-blue-800">{generateResults().personalityType}</h3>
                <p className="text-sm text-blue-700">{generateResults().description}</p>
              </div>
              <Button
                onClick={handleViewDetails}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg mb-3"
              >
                View Detailed Results
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
            {currentQuestion < totalQuestions ? "Next Question" : "Complete Quiz"}
          </Button>
        </footer>
      )}
    </div>
  )
}
