'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  Wind, 
  CloudDrizzle,
  Loader2,
  MapPin,
  AlertCircle
} from "lucide-react"
import { getWeatherRecommendations, type WeatherRecommendationsResponse } from '@/lib/api/carbon-service'

const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes in milliseconds

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherRecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)

  // Get weather icon based on conditions
  const getWeatherIcon = (conditions: string) => {
    const condition = conditions.toLowerCase()
    if (condition.includes('rain')) return <CloudRain className="h-8 w-8 text-blue-500" />
    if (condition.includes('snow')) return <CloudSnow className="h-8 w-8 text-blue-300" />
    if (condition.includes('drizzle')) return <CloudDrizzle className="h-8 w-8 text-blue-400" />
    if (condition.includes('cloud')) return <Cloud className="h-8 w-8 text-gray-500" />
    if (condition.includes('clear') || condition.includes('sun')) return <Sun className="h-8 w-8 text-amber-500" />
    if (condition.includes('wind')) return <Wind className="h-8 w-8 text-gray-600" />
    return <Cloud className="h-8 w-8 text-gray-500" />
  }

  // Fetch weather data
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWeatherRecommendations(lat, lon)
      setWeather(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data')
      console.error('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lon: longitude })
          fetchWeather(latitude, longitude)
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Fallback to a default location (e.g., London)
          const defaultLat = 51.5074
          const defaultLon = -0.1278
          setLocation({ lat: defaultLat, lon: defaultLon })
          fetchWeather(defaultLat, defaultLon)
          
          if (error.code === error.PERMISSION_DENIED) {
            setError('Location access denied. Showing weather for London.')
          }
        },
        {
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      )
    } else {
      // Geolocation not supported, use default location
      const defaultLat = 51.5074
      const defaultLon = -0.1278
      setLocation({ lat: defaultLat, lon: defaultLon })
      fetchWeather(defaultLat, defaultLon)
    }
  }, [])

  // Auto-refresh every 30 minutes
  useEffect(() => {
    if (!location) return

    const interval = setInterval(() => {
      fetchWeather(location.lat, location.lon)
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [location])

  // Loading state
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-sky-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-slate-600">Loading weather data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error && !weather) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Unable to load weather</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) return null

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-900">
            {getWeatherIcon(weather.weather.conditions)}
            Weather-Based Recommendations
          </span>
          <div className="flex items-center gap-1 text-sm font-normal text-slate-600">
            <MapPin className="h-4 w-4" />
            <span>Your Location</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weather Info */}
        <div className="flex items-center justify-between pb-4 border-b border-blue-200">
          <div>
            <p className="text-3xl font-bold text-slate-900">
              {Math.round(weather.weather.temperature)}°C
            </p>
            <p className="text-sm text-slate-600 capitalize mt-1">
              {weather.weather.description}
            </p>
          </div>
          <div className="text-right space-y-1">
            {weather.weather.humidity !== undefined && (
              <p className="text-sm text-slate-600">
                💧 Humidity: {weather.weather.humidity}%
              </p>
            )}
            {weather.weather.wind_speed !== undefined && (
              <p className="text-sm text-slate-600">
                💨 Wind: {weather.weather.wind_speed} m/s
              </p>
            )}
          </div>
        </div>

        {/* Eco-Friendly Tips */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-emerald-600">🌱</span>
            Energy-Saving Tips for Today
          </h4>
          <div className="space-y-2">
            {weather.recommendations.slice(0, 5).map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-2 bg-white/60 rounded-lg p-3 text-sm text-slate-700 hover:bg-white/80 transition-colors"
              >
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <p className="text-xs text-slate-500 text-center pt-2">
          Updates automatically every 30 minutes
        </p>
      </CardContent>
    </Card>
  )
}
