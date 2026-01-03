'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { Car, Utensils, Zap, Loader2 } from "lucide-react"

export default function TrackPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Track Activity 📝
        </h2>
        <p className="text-slate-500 mt-1">
          Log your daily activities to track your carbon footprint
        </p>
      </div>

      {/* Tracking Tabs */}
      <Tabs defaultValue="transport" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="transport" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Transport
          </TabsTrigger>
          <TabsTrigger value="diet" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Diet
          </TabsTrigger>
          <TabsTrigger value="energy" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Energy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transport">
          <TransportForm />
        </TabsContent>

        <TabsContent value="diet">
          <DietForm />
        </TabsContent>

        <TabsContent value="energy">
          <EnergyForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TransportForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('')
  const [distance, setDistance] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call - replace with actual Supabase insert
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Calculate points based on mode
      const points = mode === 'bike' || mode === 'walk' ? parseInt(distance) * 10 : 5
      
      toast({
        title: "Activity Logged! 🌱",
        description: `You added ${distance}km of ${mode}. (+${points} pts)`,
        variant: "success",
      })

      // Reset form
      setMode('')
      setDistance('')
      
      // Refresh data
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log activity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-blue-600" />
          Transport
        </CardTitle>
        <CardDescription>
          Log your transportation activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="transport-mode">Mode of Transport</Label>
            <Select
              id="transport-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              required
            >
              <option value="">Select mode...</option>
              <option value="car">Car (Petrol/Diesel)</option>
              <option value="electric-car">Electric Car</option>
              <option value="bus">Bus</option>
              <option value="train">Train</option>
              <option value="bike">Bicycle</option>
              <option value="walk">Walking</option>
              <option value="carpool">Carpool</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              placeholder="Enter distance in kilometers"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              min="0"
              step="0.1"
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log Transport"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function DietForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [mealType, setMealType] = useState('')
  const [dietType, setDietType] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const points = dietType === 'vegan' ? 20 : dietType === 'vegetarian' ? 15 : 5
      
      toast({
        title: "Meal Logged! 🥗",
        description: `${mealType} (${dietType}) recorded. (+${points} pts)`,
        variant: "success",
      })

      setMealType('')
      setDietType('')
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-emerald-600" />
          Diet
        </CardTitle>
        <CardDescription>
          Log your meals and food choices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="meal-type">Meal Type</Label>
            <Select
              id="meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              required
            >
              <option value="">Select meal...</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diet-type">Diet Type</Label>
            <Select
              id="diet-type"
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              required
            >
              <option value="">Select diet type...</option>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="poultry">Poultry</option>
              <option value="red-meat">Red Meat</option>
              <option value="local">Locally Sourced</option>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log Meal"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function EnergyForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [energyType, setEnergyType] = useState('')
  const [usage, setUsage] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Energy Usage Logged! ⚡",
        description: `${energyType} usage of ${usage} kWh recorded.`,
        variant: "success",
      })

      setEnergyType('')
      setUsage('')
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log energy usage. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-600" />
          Energy
        </CardTitle>
        <CardDescription>
          Log your home energy consumption
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="energy-type">Energy Type</Label>
            <Select
              id="energy-type"
              value={energyType}
              onChange={(e) => setEnergyType(e.target.value)}
              required
            >
              <option value="">Select type...</option>
              <option value="electricity">Electricity</option>
              <option value="natural-gas">Natural Gas</option>
              <option value="solar">Solar</option>
              <option value="heating-oil">Heating Oil</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage">Usage (kWh)</Label>
            <Input
              id="usage"
              type="number"
              placeholder="Enter usage in kWh"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              min="0"
              step="0.1"
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log Energy"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
