import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface EditProfileScreenProps {
  handleBack: () => void
  userData: {
    name: string
    username?: string
    email?: string
    bio: string
    profileImage?: string
  }
  onSave: (updatedData: any) => Promise<void>
}

export default function EditProfileScreen({ 
  handleBack, 
  userData,
  onSave 
}: EditProfileScreenProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: userData.name || "",
    username: userData.username || "",
    email: userData.email || "",
    bio: userData.bio || "",
    profileImage: userData.profileImage || ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle profile image upload with compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image less than 5MB",
        variant: "destructive"
      })
      return
    }

    // Function to compress image
    const compressImage = (base64: string, maxWidth = 800, quality = 0.8): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = base64
        img.onload = () => {
          // Create canvas and get context
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width
          let height = img.height
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          // Set canvas dimensions and draw the image
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Get compressed image as base64 string
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedBase64)
        }
      })
    }

    // Preview the image
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string
        setProfileImagePreview(imageData)
        
        try {
          // Compress image before storing it
          const compressedImage = await compressImage(imageData)
          // Store the compressed base64 image data
          setFormData(prev => ({ ...prev, profileImage: compressedImage }))
        } catch (error) {
          console.error("Error compressing image:", error)
          // Fallback to original image if compression fails
          setFormData(prev => ({ ...prev, profileImage: imageData }))
        }
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSave(formData)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      })
      handleBack()
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center">
        <button 
          className="mr-3" 
          onClick={handleBack}
          disabled={isSubmitting}
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold">Edit Profile</h1>
      </header>

      {/* Profile Edit Form */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4 relative">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-500 overflow-hidden">
                {profileImagePreview ? (
                  <img 
                    src={profileImagePreview} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : formData.profileImage ? (
                  <img 
                    src={formData.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  /> 
                ) : (
                  formData.name.charAt(0)
                )}
              </div>
              <div className="absolute bottom-0 right-0">
                <label 
                  htmlFor="profile-image-upload" 
                  className="bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </label>
                <input 
                  id="profile-image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">Tap to change profile picture</p>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Your username"
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">This will be visible to other users</p>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">We'll never share your email with anyone else</p>
            </div>
            
            <div>
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a bit about yourself"
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}