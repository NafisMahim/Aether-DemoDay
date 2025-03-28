import { Button } from "@/components/ui/button"

interface ComingSoonScreenProps {
  screen: string
  handleBack: () => void
}

export default function ComingSoonScreen({ screen, handleBack }: ComingSoonScreenProps) {
  // Convert screen name to a more readable format
  const formatScreenName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1)
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
        <h1 className="text-xl font-bold">{formatScreenName(screen)}</h1>
      </header>

      {/* Coming Soon Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Coming Soon!</h2>
        <p className="text-gray-600 text-center mb-8">
          We're working hard to bring you the {formatScreenName(screen)} feature.
          <br />
          Check back soon for updates.
        </p>
        
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="font-bold mb-3">What to expect from {formatScreenName(screen)}</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Enhanced user experience tailored to your needs</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Advanced features to boost your productivity</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Seamless integration with other Aether features</span>
            </li>
          </ul>
        </div>
        
        <Button
          className="bg-blue-500 hover:bg-blue-600"
          onClick={handleBack}
        >
          Back to Home
        </Button>
      </div>
    </div>
  )
}
