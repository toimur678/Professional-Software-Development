'use client'

export default function RecommendationCard({ recommendation, onComplete }) {
  const { id, title, description, impact, difficulty, category, completed } = recommendation

  const impactColors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  const difficultyLabels = {
    easy: '⭐',
    medium: '⭐⭐',
    hard: '⭐⭐⭐',
  }

  const categoryIcons = {
    transport: '🚗',
    energy: '⚡',
    food: '🍽️',
    waste: '♻️',
    general: '🌍',
  }

  return (
    <div className={`card border-2 transition-all ${
      completed 
        ? 'border-gray-200 bg-gray-50 opacity-75' 
        : 'border-transparent hover:border-primary-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">
          {categoryIcons[category] || '💡'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-semibold text-gray-900 ${completed ? 'line-through' : ''}`}>
              {title}
            </h3>
            {completed && (
              <div className="flex-shrink-0 text-primary-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${impactColors[impact]}`}>
              {impact.toUpperCase()} Impact
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {difficultyLabels[difficulty]} {difficulty}
            </span>
          </div>
          
          {!completed && onComplete && (
            <button
              onClick={() => onComplete(id)}
              className="mt-4 w-full btn-primary py-2 text-sm"
            >
              Mark as Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
