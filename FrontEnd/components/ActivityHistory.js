'use client'

import { useState } from 'react'

export default function ActivityHistory({ activities, onDelete }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!activities || activities.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No activities logged yet</p>
          <p className="text-sm mt-1">Start tracking your carbon footprint</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getCategoryIcon = (type) => {
    const icons = {
      transport: '🚗',
      energy: '⚡',
      food: '🍽️',
      waste: '♻️',
    }
    return icons[type] || '📊'
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const isExpanded = expandedId === activity.id

        return (
          <div
            key={activity.id}
            className="card cursor-pointer touch-feedback"
            onClick={() => setExpandedId(isExpanded ? null : activity.id)}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl flex-shrink-0">
                {getCategoryIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {activity.itemLabel || activity.type}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-primary-600">
                      {activity.carbonEmission.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">kg CO₂e</div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">
                        {activity.amount} {activity.unit || ''}
                      </span>
                    </div>
                    
                    {activity.notes && (
                      <div className="text-sm">
                        <span className="text-gray-600">Notes:</span>
                        <p className="text-gray-900 mt-1">{activity.notes}</p>
                      </div>
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(activity.id)
                        }}
                        className="w-full mt-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        Delete Activity
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <svg 
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}
