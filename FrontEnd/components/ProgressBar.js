'use client'

export default function ProgressBar({ current, goal, label, showPercentage = true }) {
  const percentage = Math.min((current / goal) * 100, 100)
  const isOverGoal = current > goal

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className={`text-sm font-semibold ${
            isOverGoal ? 'text-red-600' : 'text-primary-600'
          }`}>
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isOverGoal 
              ? 'bg-gradient-to-r from-orange-500 to-red-500' 
              : 'bg-gradient-to-r from-primary-400 to-primary-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{current.toFixed(1)} kg CO₂e</span>
        <span>Goal: {goal.toFixed(1)} kg</span>
      </div>
    </div>
  )
}
