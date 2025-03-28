import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PrivacySecurityScreenProps {
  handleBack: () => void
}

export default function PrivacySecurityScreen({ handleBack }: PrivacySecurityScreenProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public", // public, friends, private
    activityStatus: true,
    showInterests: true,
    showExperiences: true,
    locationSharing: false,
    dataPersonalization: true,
  })
  
  // Security settings state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  // Two-factor authentication state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false)
  
  // Handle privacy setting changes
  const handlePrivacyChange = (setting: string, value: any) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }
  
  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation password must match.",
        variant: "destructive"
      })
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // In a real app, this would make an API call to update the password
      // await apiRequest("POST", "/api/user/change-password", passwordData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      })
      
      // Clear the form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle privacy settings update
  const handlePrivacyUpdate = async () => {
    setIsSubmitting(true)
    
    try {
      // In a real app, this would make an API call to update privacy settings
      // await apiRequest("POST", "/api/user/privacy-settings", privacySettings)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings updated",
        description: "Your privacy settings have been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your privacy settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle toggling two-factor authentication
  const handleToggleTwoFactor = (checked: boolean) => {
    if (checked && !twoFactorEnabled) {
      // If enabling 2FA, show setup dialog/flow
      setShowTwoFactorSetup(true)
    } else if (!checked && twoFactorEnabled) {
      // If disabling 2FA, immediately update
      setTwoFactorEnabled(false)
      toast({
        title: "Two-factor authentication disabled",
        description: "Your account is now less secure. We recommend enabling 2FA for optimal security."
      })
    }
  }
  
  // Handle 2FA setup completion
  const handleTwoFactorSetupComplete = () => {
    setShowTwoFactorSetup(false)
    setTwoFactorEnabled(true)
    toast({
      title: "Two-factor authentication enabled",
      description: "Your account is now more secure. You'll need to verify your identity when logging in from new devices."
    })
  }
  
  // Handle account deletion request
  const handleDeleteAccount = async () => {
    setDeleteAccountDialog(false)
    setIsSubmitting(true)
    
    try {
      // In a real app, this would make an API call to delete the account
      // await apiRequest("DELETE", "/api/user")
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Account scheduled for deletion",
        description: "Your account will be permanently deleted in 30 days. You can cancel this action by logging in during this period."
      })
      
      // In a real app, this would redirect to logout or home
      setTimeout(() => {
        handleBack()
      }, 2000)
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive"
      })
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
        <h1 className="text-xl font-bold">Privacy & Security</h1>
      </header>
      
      {/* Settings Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <Accordion type="single" collapsible className="w-full">
          {/* Privacy Settings */}
          <AccordionItem value="privacy">
            <AccordionTrigger className="text-lg font-semibold">
              Privacy Settings
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-gray-500">Control who can see your profile</p>
                  </div>
                  <select 
                    value={privacySettings.profileVisibility} 
                    onChange={(e) => handlePrivacyChange("profileVisibility", e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Activity Status</p>
                    <p className="text-sm text-gray-500">Show when you're active on the platform</p>
                  </div>
                  <Switch 
                    checked={privacySettings.activityStatus} 
                    onCheckedChange={(checked) => handlePrivacyChange("activityStatus", checked)} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Show Interests</p>
                    <p className="text-sm text-gray-500">Display your interests on your profile</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showInterests} 
                    onCheckedChange={(checked) => handlePrivacyChange("showInterests", checked)} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Show Experiences</p>
                    <p className="text-sm text-gray-500">Display your career experiences on your profile</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showExperiences} 
                    onCheckedChange={(checked) => handlePrivacyChange("showExperiences", checked)} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Location Sharing</p>
                    <p className="text-sm text-gray-500">Allow the app to use your current location</p>
                  </div>
                  <Switch 
                    checked={privacySettings.locationSharing} 
                    onCheckedChange={(checked) => handlePrivacyChange("locationSharing", checked)} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Data Personalization</p>
                    <p className="text-sm text-gray-500">Use your data to personalize your experience</p>
                  </div>
                  <Switch 
                    checked={privacySettings.dataPersonalization} 
                    onCheckedChange={(checked) => handlePrivacyChange("dataPersonalization", checked)} 
                  />
                </div>
                
                <Button 
                  onClick={handlePrivacyUpdate} 
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
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
                  ) : "Save Privacy Settings"}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Security Settings */}
          <AccordionItem value="security">
            <AccordionTrigger className="text-lg font-semibold">
              Security Settings
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 py-2">
                {/* Password Change */}
                <div>
                  <h3 className="text-md font-semibold mb-3">Change Password</h3>
                  <form onSubmit={handlePasswordUpdate} className="space-y-3">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-500 hover:bg-blue-600 mt-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : "Update Password"}
                    </Button>
                  </form>
                </div>
                
                <Separator />
                
                {/* Two-Factor Authentication */}
                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch 
                      checked={twoFactorEnabled} 
                      onCheckedChange={handleToggleTwoFactor} 
                    />
                  </div>
                  
                  {showTwoFactorSetup && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-semibold mb-2">Setup Two-Factor Authentication</h4>
                      <p className="text-sm mb-4">Scan this QR code with an authenticator app like Google Authenticator or Authy.</p>
                      
                      {/* This would be a real QR code in a production app */}
                      <div className="bg-white p-2 mb-4 w-40 h-40 mx-auto border flex items-center justify-center">
                        <p className="text-xs text-center text-gray-500">QR Code would appear here in a real app</p>
                      </div>
                      
                      <div className="mb-4">
                        <Label htmlFor="verificationCode">Enter Verification Code</Label>
                        <Input
                          id="verificationCode"
                          type="text"
                          placeholder="123456"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowTwoFactorSetup(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleTwoFactorSetupComplete}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          Verify & Enable
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Account Deletion */}
                <div>
                  <h3 className="text-md font-semibold mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    This will permanently delete your account and all your data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteAccountDialog(true)}
                    className="w-full"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Data and Privacy Policy */}
          <AccordionItem value="data">
            <AccordionTrigger className="text-lg font-semibold">
              Data & Privacy Policy
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 py-2">
                <p className="text-sm">
                  We take your privacy seriously. Here's how we handle your data:
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Data Collection</h4>
                  <p className="text-sm text-gray-700">
                    We collect information you provide directly, such as profile information, interests, and career data. We also collect usage data to improve our services.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Data Usage</h4>
                  <p className="text-sm text-gray-700">
                    We use your data to provide personalized career recommendations, improve our services, and ensure a smooth experience on our platform.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Data Sharing</h4>
                  <p className="text-sm text-gray-700">
                    We never sell your personal data to third parties. We may share anonymized, aggregated data for analytics purposes.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Your Rights</h4>
                  <p className="text-sm text-gray-700">
                    You have the right to access, correct, or delete your personal data at any time. You can also request a copy of all your data.
                  </p>
                </div>
                
                <Button variant="outline" className="w-full mt-2">
                  Download My Data
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteAccountDialog} onOpenChange={setDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}