import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginScreenProps {
  username: string
  setUsername: (value: string) => void
  password: string
  setPassword: (value: string) => void
  handleLogin: () => void
  handleSocialLogin: (provider: string) => void
  errorMessage: string
  isLoading: boolean
}

export default function LoginScreen({
  username,
  setUsername,
  password,
  setPassword,
  handleLogin,
  handleSocialLogin,
  errorMessage,
  isLoading
}: LoginScreenProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <div className="flex flex-col justify-center items-center h-full px-6">
      <div className="w-full max-w-[320px] bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-center mb-4">
          <div className="relative w-[100px] h-[100px]">
            <img src="/assets/aether-logo.svg" alt="Aether Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">Aether</h1>
        <p className="text-sm text-gray-500 text-center mb-6">The Ultimate Personal Assistant</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Email or Username"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

          <Button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Continue"}
          </Button>

          <p className="text-sm text-blue-600 text-center cursor-pointer hover:underline">Forgot Password?</p>

          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <p className="mx-4 text-sm text-gray-500 font-medium">OR</p>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <Button
            type="button"
            variant="outline"
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
          </Button>

          <Button
            type="button"
            variant="outline"
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
          </Button>

          <Button
            type="button"
            variant="outline"
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
          </Button>

          <p className="text-sm text-center mt-4">
            No account yet? <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Sign up</span>
          </p>
        </form>
      </div>
    </div>
  )
}
