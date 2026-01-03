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
import { Car, Utensils, Zap, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { calculateCarbon } from '@/lib/api/carbon-service'

export default function TrackPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Track Activity
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
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Fallback CO2 calculation
  const calculateFallback = (distanceKm: number): number => {
    const fallbackFactors: { [key: string]: number } = {
      car: 0.21,
      'electric-car': 0.05,
      bus: 0.089,
      train: 0.041,
      bike: 0,
      walk: 0,
      carpool: 0.105,
    }
    return distanceKm * (fallbackFactors[mode] || 0.21)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const distanceValue = parseFloat(distance)
      let co2_kg: number
      let source = 'Fallback'
      let conf = 'estimated'

      // Try to get accurate calculation from API
      try {
        const result = await calculateCarbon('transport_car', distanceValue, 'km')
        co2_kg = result.co2_kg
        source = result.data_source
        conf = result.confidence
        setDataSource(source)
        setConfidence(conf)
      } catch (apiErr) {
        // Fall back to local calculation
        console.warn('API calculation failed, using fallback:', apiErr)
        co2_kg = calculateFallback(distanceValue)
        source = 'Fallback'
        conf = 'estimated'
        setDataSource(source)
        setConfidence(conf)
        setApiError('Using estimated calculation (API unavailable)')
      }

      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        category: 'transport',
        type: mode,
        value: distanceValue,
        co2_kg: co2_kg,
      })

      if (error) throw error

      toast({
        title: "Activity Logged! 🌱",
        description: `You added ${distance}km of ${mode}. (${co2_kg.toFixed(2)} kg CO₂)`,
        variant: "success",
      })

      // Reset form
      setMode('')
      setDistance('')
      setApiError(null)
      
      // Refresh data
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log activity. Please try again.",
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

          {/* Status Messages */}
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">{apiError}</p>
            </div>
          )}

          {dataSource && confidence && !apiError && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-emerald-800 font-medium">
                  Calculation from {dataSource}
                </p>
                <p className="text-emerald-700">Confidence: {confidence}</p>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
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
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Map diet types to API categories
  const getDietActivityType = (diet: string): 'diet_meat' | 'energy_electricity' => {
    // Simplified mapping - meat-based diets use diet_meat
    if (diet === 'red-meat' || diet === 'poultry' || diet === 'pescatarian') {
      return 'diet_meat'
    }
    return 'diet_meat' // Default
  }

  // Fallback calculation
  const calculateFallback = (): number => {
    const fallbackFactors: { [key: string]: number } = {
      vegan: 0.5,
      vegetarian: 1.0,
      pescatarian: 1.5,
      poultry: 2.0,
      'red-meat': 3.5,
      local: 0.8,
    }
    return fallbackFactors[dietType] || 1.5
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let co2_kg: number
      let source = 'Fallback'
      let conf = 'estimated'

      // Try API calculation (use 1 kg as standard meal weight)
      try {
        const activityType = getDietActivityType(dietType)
        const result = await calculateCarbon(activityType, 1, 'kg')
        co2_kg = result.co2_kg
        source = result.data_source
        conf = result.confidence
        setDataSource(source)
        setConfidence(conf)
      } catch (apiErr) {
        console.warn('API calculation failed, using fallback:', apiErr)
        co2_kg = calculateFallback()
        source = 'Fallback'
        conf = 'estimated'
        setDataSource(source)
        setConfidence(conf)
        setApiError('Using estimated calculation (API unavailable)')
      }

      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        category: 'diet',
        type: `${mealType}-${dietType}`,
        value: 1,
        co2_kg: co2_kg,
      })

      if (error) throw error
      
      toast({
        title: "Meal Logged! 🥗",
        description: `${mealType} (${dietType}) recorded. (${co2_kg.toFixed(2)} kg CO₂)`,
        variant: "success",
      })

      setMealType('')
      setDietType('')
      setApiError(null)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log meal. Please try again.",
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

          {/* Status Messages */}
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">{apiError}</p>
            </div>
          )}

          {dataSource && confidence && !apiError && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-emerald-800 font-medium">
                  Calculation from {dataSource}
                </p>
                <p className="text-emerald-700">Confidence: {confidence}</p>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
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
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Fallback calculation
  const calculateFallback = (usageKwh: number): number => {
    const fallbackFactors: { [key: string]: number } = {
      electricity: 0.5,
      'natural-gas': 0.18,
      solar: 0,
      'heating-oil': 2.7,
    }
    return usageKwh * (fallbackFactors[energyType] || 0.5)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const usageValue = parseFloat(usage)
      let co2_kg: number
      let source = 'Fallback'
      let conf = 'estimated'

      // Try API calculation
      try {
        const result = await calculateCarbon('energy_electricity', usageValue, 'kWh')
        co2_kg = result.co2_kg
        source = result.data_source
        conf = result.confidence
        setDataSource(source)
        setConfidence(conf)
      } catch (apiErr) {
        console.warn('API calculation failed, using fallback:', apiErr)
        co2_kg = calculateFallback(usageValue)
        source = 'Fallback'
        conf = 'estimated'
        setDataSource(source)
        setConfidence(conf)
        setApiError('Using estimated calculation (API unavailable)')
      }

      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        category: 'energy',
        type: energyType,
        value: usageValue,
        co2_kg: co2_kg,
      })

      if (error) throw error
      
      toast({
        title: "Energy Usage Logged! ⚡",
        description: `${energyType} usage of ${usage} kWh recorded. (${co2_kg.toFixed(2)} kg CO₂)`,
        variant: "success",
      })

      setEnergyType('')
      setUsage('')
      setApiError(null)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log energy usage. Please try again.",
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

          {/* Status Messages */}
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">{apiError}</p>
            </div>
          )}

          {dataSource && confidence && !apiError && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-emerald-800 font-medium">
                  Calculation from {dataSource}
                </p>
                <p className="text-emerald-700">Confidence: {confidence}</p>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
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
