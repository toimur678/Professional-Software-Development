'use client'

import { useState, useEffect } from 'react'
import CarbonChart from '@/components/CarbonChart'
import ProgressBar from '@/components/ProgressBar'
import ActivityHistory from '@/components/ActivityHistory'
import { activityAPI } from '@/lib/api'
import { CARBON_GOALS } from '@/lib/constants'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats and activities
      // For now, using mock data - replace with actual API calls
      const mockStats = {
        daily: 12.5,
        weekly: 87.5,
        monthly: 350,
        trend: '+5%',
      }

      const mockActivities = [
        {
          id: 1,
          type: 'transport',
          itemLabel: 'Car',
          amount: 15,
          unit: 'km',
          carbonEmission: 3.15,
          date: new Date().toISOString(),
          notes: 'Commute to work',
        },
        {
          id: 2,
          type: 'energy',
          itemLabel: 'Electricity',
          amount: 20,
          unit: 'kWh',
          carbonEmission: 9.5,
          date: new Date(Date.now() - 86400000).toISOString(),
        },
      ]

      const mockChartData = [
        { name: 'Mon', value: 14.2, goal: CARBON_GOALS.DAILY },
        { name: 'Tue', value: 16.8, goal: CARBON_GOALS.DAILY },
        { name: 'Wed', value: 13.5, goal: CARBON_GOALS.DAILY },
        { name: 'Thu', value: 15.1, goal: CARBON_GOALS.DAILY },
        { name: 'Fri', value: 18.2, goal: CARBON_GOALS.DAILY },
        { name: 'Sat', value: 12.3, goal: CARBON_GOALS.DAILY },
        { name: 'Sun', value: 12.5, goal: CARBON_GOALS.DAILY },
      ]

      setStats(mockStats)
      setActivities(mockActivities)
      setChartData(mockChartData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteActivity = async (id) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        // await activityAPI.delete(id)
        setActivities(activities.filter(a => a.id !== id))
      } catch (error) {
        console.error('Error deleting activity:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-6 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold mb-1">EcoWisely</h1>
        <p className="text-primary-100 text-sm">Track your carbon footprint</p>
        
        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{stats.daily.toFixed(1)}</div>
            <div className="text-xs text-primary-100">Today</div>
            <div className="text-xs text-primary-100">kg CO₂e</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{stats.weekly.toFixed(1)}</div>
            <div className="text-xs text-primary-100">This Week</div>
            <div className="text-xs text-primary-100">kg CO₂e</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{stats.monthly.toFixed(0)}</div>
            <div className="text-xs text-primary-100">This Month</div>
            <div className="text-xs text-primary-100">kg CO₂e</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Progress Bars */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Goals</h2>
          <ProgressBar 
            current={stats.daily} 
            goal={CARBON_GOALS.DAILY} 
            label="Daily Progress"
          />
          <ProgressBar 
            current={stats.weekly} 
            goal={CARBON_GOALS.WEEKLY} 
            label="Weekly Progress"
          />
        </div>

        {/* Chart */}
        <CarbonChart 
          data={chartData} 
          type="bar" 
          goal={CARBON_GOALS.DAILY}
        />

        {/* Recent Activities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <button className="text-sm text-primary-600 font-medium">
              View All
            </button>
          </div>
          <ActivityHistory 
            activities={activities} 
            onDelete={handleDeleteActivity}
          />
        </div>

        {/* Tips Card */}
        <div className="card bg-gradient-to-br from-primary-50 to-green-50 border-2 border-primary-200">
          <div className="flex items-start gap-3">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Daily Tip</h3>
              <p className="text-sm text-gray-600">
                Try carpooling or using public transport to reduce your carbon footprint by up to 50%!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
