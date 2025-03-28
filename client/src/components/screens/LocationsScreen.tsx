import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface Location {
  id: number
  name: string
  type: "home" | "work" | "favorite"
  address: string
}

interface LocationsScreenProps {
  handleBack: () => void
}

export default function LocationsScreen({ handleBack }: LocationsScreenProps) {
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>([
    { id: 1, name: "Home", type: "home", address: "123 Main St, San Francisco, CA 94105" },
    { id: 2, name: "Office", type: "work", address: "456 Market St, San Francisco, CA 94103" },
    { id: 3, name: "Gym", type: "favorite", address: "789 Fitness Ave, San Francisco, CA 94107" },
    { id: 4, name: "Coffee Shop", type: "favorite", address: "101 Bean St, San Francisco, CA 94104" }
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: "",
    type: "favorite",
    address: ""
  })

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.address) {
      toast({
        title: "Required fields missing",
        description: "Please enter both name and address.",
        variant: "destructive"
      })
      return
    }

    const location: Location = {
      id: Date.now(),
      name: newLocation.name,
      type: newLocation.type as "home" | "work" | "favorite",
      address: newLocation.address
    }

    setLocations([...locations, location])
    setNewLocation({
      name: "",
      type: "favorite",
      address: ""
    })
    setShowAddForm(false)

    toast({
      title: "Location added",
      description: `${location.name} has been added to your locations.`
    })
  }

  const handleDeleteLocation = (id: number) => {
    setLocations(locations.filter(loc => loc.id !== id))
    toast({
      title: "Location removed",
      description: "The location has been removed from your list."
    })
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "home":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        )
      case "work":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        )
    }
  }

  const getColorForType = (type: string) => {
    switch (type) {
      case "home":
        return "bg-blue-100 text-blue-600"
      case "work":
        return "bg-purple-100 text-purple-600"
      default:
        return "bg-yellow-100 text-yellow-600"
    }
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
        <h1 className="text-xl font-bold">My Locations</h1>
      </header>

      {/* Locations Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Saved Places</h2>
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
            <h3 className="font-medium mb-3">Add New Location</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Name *</label>
                <Input
                  placeholder="e.g. Favorite Restaurant"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Type</label>
                <div className="flex space-x-2">
                  <Button 
                    variant={newLocation.type === "home" ? "default" : "outline"}
                    className={newLocation.type === "home" ? "bg-blue-500" : ""}
                    onClick={() => setNewLocation({...newLocation, type: "home"})}
                  >
                    Home
                  </Button>
                  <Button 
                    variant={newLocation.type === "work" ? "default" : "outline"}
                    className={newLocation.type === "work" ? "bg-purple-500" : ""}
                    onClick={() => setNewLocation({...newLocation, type: "work"})}
                  >
                    Work
                  </Button>
                  <Button 
                    variant={newLocation.type === "favorite" ? "default" : "outline"}
                    className={newLocation.type === "favorite" ? "bg-yellow-500" : ""}
                    onClick={() => setNewLocation({...newLocation, type: "favorite"})}
                  >
                    Favorite
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Address *</label>
                <Input
                  placeholder="Full address"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                />
              </div>
              <Button 
                className="w-full bg-blue-500 text-white"
                onClick={handleAddLocation}
              >
                Save Location
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {locations.map((location) => (
            <div key={location.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getColorForType(location.type)}`}>
                    {getIconForType(location.type)}
                  </div>
                  <div>
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="text-sm text-gray-500">{location.address}</p>
                  </div>
                </div>
                <button className="text-gray-400 mt-1" onClick={() => handleDeleteLocation(location.id)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    toast({
                      title: "Navigation started",
                      description: `Navigating to ${location.name}`
                    })
                  }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                  Navigate
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    toast({
                      title: "Sharing location",
                      description: `Sharing ${location.name}`
                    })
                  }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                  </svg>
                  Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
