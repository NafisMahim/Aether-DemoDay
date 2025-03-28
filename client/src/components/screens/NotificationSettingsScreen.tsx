import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface NotificationSettingsScreenProps {
  handleBack: () => void
}

export default function NotificationSettingsScreen({ handleBack }: NotificationSettingsScreenProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Notification settings state
  const [appNotifications, setAppNotifications] = useState({
    messages: true,
    mentions: true,
    connections: true,
    careerOpportunities: true,
    courseUpdates: false,
    systemAnnouncements: true,
    weeklyDigest: true,
    careerTips: true,
    quizReminders: true,
  })
  
  const [emailNotifications, setEmailNotifications] = useState({
    messages: false,
    mentions: false,
    connections: true,
    careerOpportunities: true,
    courseUpdates: false,
    systemAnnouncements: false,
    weeklyDigest: true,
    careerTips: false,
    quizReminders: false,
  })
  
  const [pushNotifications, setPushNotifications] = useState({
    messages: true,
    mentions: true,
    connections: true,
    careerOpportunities: false,
    courseUpdates: false,
    systemAnnouncements: false,
    weeklyDigest: false,
    careerTips: false,
    quizReminders: true,
  })
  
  // Quiet hours settings
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: "22:00",
    endTime: "07:00",
    excludeMessages: true,
    enabledDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    }
  })
  
  // Handle app notification toggle
  const handleAppNotificationToggle = (key: string, value: boolean) => {
    setAppNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  // Handle email notification toggle
  const handleEmailNotificationToggle = (key: string, value: boolean) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  // Handle push notification toggle
  const handlePushNotificationToggle = (key: string, value: boolean) => {
    setPushNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  // Handle quiet hours toggle
  const handleQuietHoursToggle = (value: boolean) => {
    setQuietHours(prev => ({
      ...prev,
      enabled: value
    }))
  }
  
  // Handle quiet hours time change
  const handleQuietHoursTimeChange = (type: 'startTime' | 'endTime', value: string) => {
    setQuietHours(prev => ({
      ...prev,
      [type]: value
    }))
  }
  
  // Handle quiet hours day toggle
  const handleQuietHoursDayToggle = (day: string, value: boolean) => {
    setQuietHours(prev => ({
      ...prev,
      enabledDays: {
        ...prev.enabledDays,
        [day]: value
      }
    }))
  }
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    setIsSubmitting(true)
    
    try {
      // In a real app, this would make an API call to update notification settings
      // await apiRequest("POST", "/api/user/notification-settings", {
      //   appNotifications,
      //   emailNotifications,
      //   pushNotifications,
      //   quietHours
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved."
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error saving your notification settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle "Turn off all" for a specific channel
  const handleTurnOffAll = (channel: 'app' | 'email' | 'push') => {
    if (channel === 'app') {
      const allOff = Object.fromEntries(
        Object.keys(appNotifications).map(key => [key, false])
      )
      setAppNotifications(allOff as typeof appNotifications)
    } else if (channel === 'email') {
      const allOff = Object.fromEntries(
        Object.keys(emailNotifications).map(key => [key, false])
      )
      setEmailNotifications(allOff as typeof emailNotifications)
    } else if (channel === 'push') {
      const allOff = Object.fromEntries(
        Object.keys(pushNotifications).map(key => [key, false])
      )
      setPushNotifications(allOff as typeof pushNotifications)
    }
    
    toast({
      title: `${channel.charAt(0).toUpperCase() + channel.slice(1)} notifications disabled`,
      description: `All ${channel} notifications have been turned off.`
    })
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
        <h1 className="text-xl font-bold">Notification Settings</h1>
      </header>
      
      {/* Settings Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <Tabs defaultValue="app" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="app">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                In-App
              </div>
            </TabsTrigger>
            <TabsTrigger value="email">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Email
              </div>
            </TabsTrigger>
            <TabsTrigger value="push">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                Push
              </div>
            </TabsTrigger>
          </TabsList>
          
          {/* App Notifications Tab */}
          <TabsContent value="app" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">App Notifications</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTurnOffAll('app')}
              >
                Turn off all
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-messages" className="font-medium">Messages</Label>
                  <p className="text-xs text-gray-500">Notifications for new messages</p>
                </div>
                <Switch 
                  id="app-messages"
                  checked={appNotifications.messages} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('messages', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-mentions" className="font-medium">Mentions</Label>
                  <p className="text-xs text-gray-500">When someone mentions you</p>
                </div>
                <Switch 
                  id="app-mentions"
                  checked={appNotifications.mentions} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('mentions', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-connections" className="font-medium">New Connections</Label>
                  <p className="text-xs text-gray-500">When someone connects with you</p>
                </div>
                <Switch 
                  id="app-connections"
                  checked={appNotifications.connections} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('connections', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-career" className="font-medium">Career Opportunities</Label>
                  <div className="flex items-center">
                    <p className="text-xs text-gray-500 mr-1">Job suggestions based on your profile</p>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200">Premium</Badge>
                  </div>
                </div>
                <Switch 
                  id="app-career"
                  checked={appNotifications.careerOpportunities} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('careerOpportunities', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-courses" className="font-medium">Course Updates</Label>
                  <p className="text-xs text-gray-500">Updates to courses you're enrolled in</p>
                </div>
                <Switch 
                  id="app-courses"
                  checked={appNotifications.courseUpdates} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('courseUpdates', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-system" className="font-medium">System Announcements</Label>
                  <p className="text-xs text-gray-500">Important updates about the platform</p>
                </div>
                <Switch 
                  id="app-system"
                  checked={appNotifications.systemAnnouncements} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('systemAnnouncements', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-weekly" className="font-medium">Weekly Digest</Label>
                  <p className="text-xs text-gray-500">Weekly summary of your activity</p>
                </div>
                <Switch 
                  id="app-weekly"
                  checked={appNotifications.weeklyDigest} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('weeklyDigest', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-tips" className="font-medium">Career Tips</Label>
                  <p className="text-xs text-gray-500">Personalized career advice</p>
                </div>
                <Switch 
                  id="app-tips"
                  checked={appNotifications.careerTips} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('careerTips', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="app-quiz" className="font-medium">Quiz Reminders</Label>
                  <p className="text-xs text-gray-500">Reminders to take quizzes</p>
                </div>
                <Switch 
                  id="app-quiz"
                  checked={appNotifications.quizReminders} 
                  onCheckedChange={(checked) => handleAppNotificationToggle('quizReminders', checked)} 
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Email Notifications Tab */}
          <TabsContent value="email" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Email Notifications</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTurnOffAll('email')}
              >
                Turn off all
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="email-messages" className="font-medium">Messages</Label>
                  <p className="text-xs text-gray-500">Email notifications for new messages</p>
                </div>
                <Switch 
                  id="email-messages"
                  checked={emailNotifications.messages} 
                  onCheckedChange={(checked) => handleEmailNotificationToggle('messages', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="email-mentions" className="font-medium">Mentions</Label>
                  <p className="text-xs text-gray-500">When someone mentions you</p>
                </div>
                <Switch 
                  id="email-mentions"
                  checked={emailNotifications.mentions} 
                  onCheckedChange={(checked) => handleEmailNotificationToggle('mentions', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="email-connections" className="font-medium">New Connections</Label>
                  <p className="text-xs text-gray-500">When someone connects with you</p>
                </div>
                <Switch 
                  id="email-connections"
                  checked={emailNotifications.connections} 
                  onCheckedChange={(checked) => handleEmailNotificationToggle('connections', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="email-career" className="font-medium">Career Opportunities</Label>
                  <div className="flex items-center">
                    <p className="text-xs text-gray-500 mr-1">Job suggestions based on your profile</p>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200">Premium</Badge>
                  </div>
                </div>
                <Switch 
                  id="email-career"
                  checked={emailNotifications.careerOpportunities} 
                  onCheckedChange={(checked) => handleEmailNotificationToggle('careerOpportunities', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="email-weekly" className="font-medium">Weekly Digest</Label>
                  <p className="text-xs text-gray-500">Weekly summary of your activity</p>
                </div>
                <Switch 
                  id="email-weekly"
                  checked={emailNotifications.weeklyDigest} 
                  onCheckedChange={(checked) => handleEmailNotificationToggle('weeklyDigest', checked)} 
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Push Notifications Tab */}
          <TabsContent value="push" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Push Notifications</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTurnOffAll('push')}
              >
                Turn off all
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="push-messages" className="font-medium">Messages</Label>
                  <p className="text-xs text-gray-500">Push notifications for new messages</p>
                </div>
                <Switch 
                  id="push-messages"
                  checked={pushNotifications.messages} 
                  onCheckedChange={(checked) => handlePushNotificationToggle('messages', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="push-mentions" className="font-medium">Mentions</Label>
                  <p className="text-xs text-gray-500">When someone mentions you</p>
                </div>
                <Switch 
                  id="push-mentions"
                  checked={pushNotifications.mentions} 
                  onCheckedChange={(checked) => handlePushNotificationToggle('mentions', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="push-connections" className="font-medium">New Connections</Label>
                  <p className="text-xs text-gray-500">When someone connects with you</p>
                </div>
                <Switch 
                  id="push-connections"
                  checked={pushNotifications.connections} 
                  onCheckedChange={(checked) => handlePushNotificationToggle('connections', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="push-quiz" className="font-medium">Quiz Reminders</Label>
                  <p className="text-xs text-gray-500">Reminders to take quizzes</p>
                </div>
                <Switch 
                  id="push-quiz"
                  checked={pushNotifications.quizReminders} 
                  onCheckedChange={(checked) => handlePushNotificationToggle('quizReminders', checked)} 
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Quiet Hours Settings */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Quiet Hours</h2>
              <p className="text-sm text-gray-500">Disable notifications during specific hours</p>
            </div>
            <Switch 
              checked={quietHours.enabled} 
              onCheckedChange={handleQuietHoursToggle} 
            />
          </div>
          
          {quietHours.enabled && (
            <div className="space-y-4 pl-1 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start" className="text-sm font-medium">Start Time</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={quietHours.startTime}
                    onChange={(e) => handleQuietHoursTimeChange('startTime', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end" className="text-sm font-medium">End Time</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={quietHours.endTime}
                    onChange={(e) => handleQuietHoursTimeChange('endTime', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Days</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(quietHours.enabledDays).map(([day, enabled]) => (
                    <Button
                      key={day}
                      type="button"
                      variant={enabled ? "default" : "outline"}
                      className={`text-xs px-3 py-1 h-auto ${enabled ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                      onClick={() => handleQuietHoursDayToggle(day, !enabled)}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="exclude-messages"
                  checked={quietHours.excludeMessages}
                  onCheckedChange={(checked) => {
                    setQuietHours(prev => ({
                      ...prev,
                      excludeMessages: checked
                    }))
                  }}
                />
                <Label htmlFor="exclude-messages" className="text-sm">Allow message notifications during quiet hours</Label>
              </div>
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <Button 
          onClick={saveNotificationSettings} 
          className="w-full mt-8 bg-blue-500 hover:bg-blue-600"
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
          ) : "Save Notification Settings"}
        </Button>
      </div>
    </div>
  )
}