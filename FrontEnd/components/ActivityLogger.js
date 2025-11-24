'use client'

import { useState } from 'react'
import { TRANSPORT_MODES, ENERGY_TYPES, FOOD_TYPES, WASTE_TYPES, ACTIVITY_TYPES } from '@/lib/constants'

export default function ActivityLogger({ onSubmit, onCancel }) {
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES.TRANSPORT)
  const [selectedItem, setSelectedItem] = useState(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getItemsByType = () => {
    switch (activityType) {
      case ACTIVITY_TYPES.TRANSPORT:
        return TRANSPORT_MODES
      case ACTIVITY_TYPES.ENERGY:
        return ENERGY_TYPES
      case ACTIVITY_TYPES.FOOD:
        return FOOD_TYPES
      case ACTIVITY_TYPES.WASTE:
        return WASTE_TYPES
      default:
        return []
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem || !amount) return

    setIsSubmitting(true)
    
    const activity = {
      type: activityType,
      itemId: selectedItem.id,
      itemLabel: selectedItem.label,
      amount: parseFloat(amount),
      carbonEmission: parseFloat(amount) * selectedItem.carbonFactor,
      date,
      notes,
    }

    try {
      await onSubmit(activity)
      // Reset form
      setSelectedItem(null)
      setAmount('')
      setNotes('')
    } catch (error) {
      console.error('Error submitting activity:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const items = getItemsByType()

  return (
    <div className="p-4 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Activity Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Activity Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(ACTIVITY_TYPES).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setActivityType(type)
                  setSelectedItem(null)
                }}
                className={`p-3 rounded-lg border-2 capitalize transition-all ${
                  activityType === type
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Item Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select {activityType}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        {selectedItem && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount {selectedItem.unit && `(${selectedItem.unit})`}
            </label>
            <input
              type="number"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="input"
              required
            />
          </div>
        )}

        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Carbon Preview */}
        {selectedItem && amount && (
          <div className="card bg-primary-50 border-2 border-primary-200">
            <div className="text-center">
              <div className="text-sm text-primary-700 font-medium mb-1">
                Estimated Carbon Emission
              </div>
              <div className="text-3xl font-bold text-primary-600">
                {(parseFloat(amount) * selectedItem.carbonFactor).toFixed(2)}
              </div>
              <div className="text-sm text-primary-600">kg CO₂e</div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!selectedItem || !amount || isSubmitting}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Logging...' : 'Log Activity'}
          </button>
        </div>
      </form>
    </div>
  )
}
