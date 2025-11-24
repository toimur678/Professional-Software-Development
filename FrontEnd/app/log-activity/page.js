'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ActivityLogger from '@/components/ActivityLogger'
import { activityAPI } from '@/lib/api'

export default function LogActivityPage() {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (activity) => {
    try {
      // await activityAPI.create(activity)
      
      // Show success message
      setShowSuccess(true)
      
      // Hide success message and redirect after 2 seconds
      setTimeout(() => {
        setShowSuccess(false)
        router.push('/')
      }, 2000)
      
      console.log('Activity logged:', activity)
    } catch (error) {
      console.error('Error logging activity:', error)
      alert('Failed to log activity. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-6 rounded-b-3xl shadow-lg">
        <button
          onClick={handleCancel}
          className="mb-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold mb-1">Log Activity</h1>
        <p className="text-primary-100 text-sm">Track your daily carbon footprint</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 max-w-[430px] mx-auto z-50 animate-bounce">
          <div className="card bg-primary-600 text-white border-0 shadow-xl">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">Activity Logged!</p>
                <p className="text-sm text-primary-100">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logger Form */}
      <ActivityLogger onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}
