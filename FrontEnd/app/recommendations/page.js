'use client'

import { useState, useEffect } from 'react'
import RecommendationCard from '@/components/RecommendationCard'
import { recommendationAPI } from '@/lib/api'

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockRecommendations = [
        {
          id: 1,
          title: 'Switch to LED Bulbs',
          description: 'Replace traditional bulbs with energy-efficient LED lights to reduce electricity consumption by up to 75%.',
          impact: 'high',
          difficulty: 'easy',
          category: 'energy',
          completed: false,
        },
        {
          id: 2,
          title: 'Use Public Transportation',
          description: 'Take the bus or train instead of driving alone. Can reduce your carbon footprint by 4.6 tons per year.',
          impact: 'high',
          difficulty: 'medium',
          category: 'transport',
          completed: false,
        },
        {
          id: 3,
          title: 'Reduce Meat Consumption',
          description: 'Try Meatless Mondays! Reducing meat intake even once a week can significantly lower your carbon footprint.',
          impact: 'high',
          difficulty: 'medium',
          category: 'food',
          completed: false,
        },
        {
          id: 4,
          title: 'Start Composting',
          description: 'Compost your food waste instead of throwing it away. This reduces methane emissions from landfills.',
          impact: 'medium',
          difficulty: 'medium',
          category: 'waste',
          completed: false,
        },
        {
          id: 5,
          title: 'Unplug Devices',
          description: 'Unplug electronics when not in use to prevent phantom energy consumption.',
          impact: 'medium',
          difficulty: 'easy',
          category: 'energy',
          completed: true,
        },
        {
          id: 6,
          title: 'Use Reusable Bags',
          description: 'Bring your own bags when shopping to reduce plastic waste.',
          impact: 'low',
          difficulty: 'easy',
          category: 'waste',
          completed: true,
        },
        {
          id: 7,
          title: 'Adjust Thermostat',
          description: 'Lower heating by 1°C in winter and raise cooling by 1°C in summer to save energy.',
          impact: 'medium',
          difficulty: 'easy',
          category: 'energy',
          completed: false,
        },
        {
          id: 8,
          title: 'Carpool to Work',
          description: 'Share rides with colleagues to reduce individual carbon emissions and save money.',
          impact: 'high',
          difficulty: 'medium',
          category: 'transport',
          completed: false,
        },
      ]

      setRecommendations(mockRecommendations)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id) => {
    try {
      // await recommendationAPI.complete(id)
      setRecommendations(recommendations.map(rec => 
        rec.id === id ? { ...rec, completed: true } : rec
      ))
    } catch (error) {
      console.error('Error completing recommendation:', error)
    }
  }

  const filteredRecommendations = recommendations.filter(rec => {
    if (filter === 'all') return true
    if (filter === 'active') return !rec.completed
    if (filter === 'completed') return rec.completed
    return true
  })

  const activeCount = recommendations.filter(r => !r.completed).length
  const completedCount = recommendations.filter(r => r.completed).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-6 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold mb-1">Eco Tips</h1>
        <p className="text-primary-100 text-sm">Personalized recommendations for you</p>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{activeCount}</div>
            <div className="text-xs text-primary-100">Active Tips</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{completedCount}</div>
            <div className="text-xs text-primary-100">Completed</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex gap-1 p-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-4 space-y-4">
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onComplete={handleComplete}
            />
          ))
        ) : (
          <div className="card text-center py-8">
            <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No recommendations found</p>
          </div>
        )}
      </div>
    </div>
  )
}
