import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  requirement: number
  progress?: number
}

const allAchievements: Achievement[] = [
  { 
    id: "1", 
    name: "First Steps", 
    description: "Log your first activity", 
    icon: "👣",
    category: "Getting Started",
    requirement: 1
  },
  { 
    id: "2", 
    name: "Week Warrior", 
    description: "Log activities for 7 consecutive days", 
    icon: "🗓️",
    category: "Consistency",
    requirement: 7
  },
  { 
    id: "3", 
    name: "Carbon Cutter", 
    description: "Reduce your weekly emissions by 20%", 
    icon: "✂️",
    category: "Impact",
    requirement: 20
  },
  { 
    id: "4", 
    name: "Bike Enthusiast", 
    description: "Cycle 100km total", 
    icon: "🚴",
    category: "Transport",
    requirement: 100
  },
  { 
    id: "5", 
    name: "Green Gourmet", 
    description: "Log 30 vegetarian meals", 
    icon: "🥗",
    category: "Diet",
    requirement: 30
  },
  { 
    id: "6", 
    name: "Power Saver", 
    description: "Reduce energy consumption by 15%", 
    icon: "💡",
    category: "Energy",
    requirement: 15
  },
  { 
    id: "7", 
    name: "Century Club", 
    description: "Save 100kg of CO₂ total", 
    icon: "🏆",
    category: "Milestones",
    requirement: 100
  },
  { 
    id: "8", 
    name: "Eco Champion", 
    description: "Reach 1000 eco points", 
    icon: "🌟",
    category: "Milestones",
    requirement: 1000
  },
  { 
    id: "9", 
    name: "Tree Hugger", 
    description: "Equivalent of planting 10 trees", 
    icon: "🌳",
    category: "Impact",
    requirement: 10
  },
  { 
    id: "10", 
    name: "Public Transit Pro", 
    description: "Use public transport 20 times", 
    icon: "🚌",
    category: "Transport",
    requirement: 20
  },
  { 
    id: "11", 
    name: "Vegan Venture", 
    description: "Log 10 vegan meals", 
    icon: "🌱",
    category: "Diet",
    requirement: 10
  },
  { 
    id: "12", 
    name: "Solar Spirit", 
    description: "Use renewable energy for a month", 
    icon: "☀️",
    category: "Energy",
    requirement: 30
  },
]

// Mock unlocked achievements - replace with actual data from Supabase
const unlockedIds = new Set(["1", "2", "5", "10"])

// Mock progress data
const progressData: Record<string, number> = {
  "3": 15,
  "4": 67,
  "6": 8,
  "7": 45,
  "8": 320,
  "9": 3,
  "11": 4,
  "12": 12,
}

export default function AchievementsPage() {
  const categories = [...new Set(allAchievements.map(a => a.category))]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Achievements 🏆
        </h2>
        <p className="text-slate-500 mt-1">
          Track your eco milestones and earn badges
        </p>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="text-4xl">🎯</div>
        <div>
          <p className="text-2xl font-bold text-emerald-700">
            {unlockedIds.size} / {allAchievements.length}
          </p>
          <p className="text-sm text-emerald-600">Achievements Unlocked</p>
        </div>
      </div>

      {/* Achievements by Category */}
      {categories.map((category) => {
        const categoryAchievements = allAchievements.filter(a => a.category === category)
        
        return (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{category}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryAchievements.map((achievement) => {
                const isUnlocked = unlockedIds.has(achievement.id)
                const progress = progressData[achievement.id] || 0
                const progressPercent = Math.min((progress / achievement.requirement) * 100, 100)

                return (
                  <Card 
                    key={achievement.id} 
                    className={cn(
                      "transition-all duration-200 hover:shadow-md",
                      !isUnlocked && "opacity-60 grayscale bg-gray-50 border-dashed",
                      isUnlocked && "border-green-200 bg-green-50/50"
                    )}
                  >
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-full text-2xl flex items-center justify-center", 
                        isUnlocked ? "bg-green-100" : "bg-gray-200"
                      )}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {achievement.name}
                          {isUnlocked && <span className="text-green-600">✓</span>}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {achievement.description}
                        </CardDescription>
                        {!isUnlocked && progress > 0 && (
                          <div className="mt-2 space-y-1">
                            <Progress value={progressPercent} className="h-2" />
                            <p className="text-xs text-slate-500">
                              {progress} / {achievement.requirement}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
