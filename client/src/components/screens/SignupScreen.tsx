import { useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SignupScreenProps {
  onBackToLogin: () => void
  onSignupSubmit: (username: string, email: string, password: string) => void
  errorMessage: string
  isLoading: boolean
}

export default function SignupScreen({
  onBackToLogin,
  onSignupSubmit,
  errorMessage,
  isLoading
}: SignupScreenProps) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError("")

    // Basic client-side validation
    if (!username || !email || !password || !confirmPassword) {
      setLocalError("All fields are required")
      return
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters")
      return
    }

    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setLocalError("Please enter a valid email address")
      return
    }

    onSignupSubmit(username, email, password)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={onBackToLogin}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Create Account</h1>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Join Aether</h2>
            <p className="text-muted-foreground mt-2">
              Your personal AI assistant that helps you manage your daily life
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white"
              />
            </div>

            {(errorMessage || localError) && (
              <div className="text-sm font-medium text-red-500 mt-2">
                {localError || errorMessage}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>

            <p className="text-sm text-center mt-4">
              Already have an account?{" "}
              <span onClick={onBackToLogin} className="text-blue-600 font-semibold cursor-pointer hover:underline">
                Log in
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}