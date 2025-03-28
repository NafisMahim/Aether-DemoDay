import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Experience {
  id: number
  title: string
  company: string
  period: string
  description: string
}

interface ExperienceScreenProps {
  handleBack: () => void
}

export default function ExperienceScreen({ handleBack }: ExperienceScreenProps) {
  const { toast } = useToast()
  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      period: "2020 - Present",
      description: "Leading the development of the company's flagship product. Managing a team of 5 developers."
    },
    {
      id: 2,
      title: "Software Developer",
      company: "InnoSoft",
      period: "2017 - 2020",
      description: "Developed web applications using React and Node.js. Implemented CI/CD pipelines."
    },
    {
      id: 3,
      title: "Junior Developer",
      company: "StartUp Ventures",
      period: "2015 - 2017",
      description: "Worked on front-end development using HTML, CSS, and JavaScript."
    }
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExperience, setNewExperience] = useState<Partial<Experience>>({
    title: "",
    company: "",
    period: "",
    description: ""
  })

  const handleAddExperience = () => {
    if (!newExperience.title || !newExperience.company || !newExperience.period) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const experience: Experience = {
      id: Date.now(),
      title: newExperience.title || "",
      company: newExperience.company || "",
      period: newExperience.period || "",
      description: newExperience.description || ""
    }

    setExperiences([experience, ...experiences])
    setNewExperience({
      title: "",
      company: "",
      period: "",
      description: ""
    })
    setShowAddForm(false)

    toast({
      title: "Experience added",
      description: "Your new experience has been added successfully."
    })
  }

  const handleDeleteExperience = (id: number) => {
    setExperiences(experiences.filter(exp => exp.id !== id))
    toast({
      title: "Experience removed",
      description: "The experience entry has been removed."
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center">
        <button className="mr-3" onClick={handleBack}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold">My Experience</h1>
      </header>

      {/* Experience Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Work History</h2>
          <Button 
            variant="outline"
            className="text-blue-500 border-blue-500"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "Add New"}
          </Button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-medium mb-3">Add New Experience</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Job Title *</label>
                <Input
                  placeholder="e.g. Software Engineer"
                  value={newExperience.title}
                  onChange={(e) => setNewExperience({...newExperience, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Company *</label>
                <Input
                  placeholder="e.g. Acme Inc."
                  value={newExperience.company}
                  onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Period *</label>
                <Input
                  placeholder="e.g. 2020 - Present"
                  value={newExperience.period}
                  onChange={(e) => setNewExperience({...newExperience, period: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <Textarea
                  placeholder="Describe your responsibilities and achievements"
                  value={newExperience.description}
                  onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                  rows={3}
                />
              </div>
              <Button 
                className="w-full bg-blue-500 text-white"
                onClick={handleAddExperience}
              >
                Save Experience
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {experiences.map((experience) => (
            <div key={experience.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">{experience.title}</h3>
                <button className="text-red-500" onClick={() => handleDeleteExperience(experience.id)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-700">{experience.company}</p>
              <p className="text-xs text-gray-500 mt-1">{experience.period}</p>
              <p className="text-sm mt-2">{experience.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
