import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { 
  Footprints, 
  Calendar, 
  Scissors, 
  Bike, 
  Salad, 
  Lightbulb, 
  Trophy, 
  Star, 
  TreeDeciduous, 
  Bus, 
  Sprout, 
  Sun,
  Target,
  LucideIcon,
  Check
} from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: string
  requirement: number
  progress?: number
}

// Default achievements definitions - these could also come from the database
const allAchievements: Achievement[] = [
  { 
    id: "1", 
    name: "First Steps", 
    description: "Log your first activity", 
    icon: Footprints,
    category: "Getting Started",
    requirement: 1
  },
  { 
    id: "2", 
    name: "Week Warrior", 
    description: "Log activities for 7 consecutive days", 
    icon: Calendar,
    category: "Consistency",
    requirement: 7
  },
  { 
    id: "3", 
    name: "Carbon Cutter", 
    description: "Reduce your weekly emissions by 20%", 
    icon: Scissors,
    category: "Impact",
    requirement: 20
  },
  { 
    id: "4", 
    name: "Bike Enthusiast", 
    description: "Cycle 100km total", 
    icon: Bike,
    category: "Transport",
    requirement: 100
  },
  { 
    id: "5", 
    name: "Green Gourmet", 
    description: "Log 30 vegetarian meals", 
    icon: Salad,
    category: "Diet",
    requirement: 30
  },
  { 
    id: "6", 
    name: "Power Saver", 
    description: "Reduce energy consumption by 15%", 
    icon: Lightbulb,
    category: "Energy",
    requirement: 15
  },
  { 
    id: "7", 
    name: "Century Club", 
    description: "Save 100kg of CO₂ total", 
    icon: Trophy,
    category: "Milestones",
    requirement: 100
  },
  { 
    id: "8", 
    name: "Eco Champion", 
    description: "Reach 1000 eco points", 
    icon: Star,
    category: "Milestones",
    requirement: 1000
  },
  { 
    id: "9", 
    name: "Tree Hugger", 
    description: "Equivalent of planting 10 trees", 
    icon: TreeDeciduous,
    category: "Impact",
    requirement: 10
  },
  { 
    id: "10", 
    name: "Public Transit Pro", 
    description: "Use public transport 20 times", 
    icon: Bus,
    category: "Transport",
    requirement: 20
  },
  { 
    id: "11", 
    name: "Vegan Venture", 
    description: "Log 10 vegan meals", 
    icon: Sprout,
    category: "Diet",
    requirement: 10
  },
  { 
    id: "12", 
    name: "Solar Spirit", 
    description: "Use renewable energy for a month", 
    icon: Sun,
    category: "Energy",
    requirement: 30
  },
]

export default async function AchievementsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch user's unlocked achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', user.id)

  const unlockedIds = new Set(
    (userAchievements as { achievement_id: string }[] | null)?.map(ua => ua.achievement_id) || []
  )

  // Fetch user's points for progress calculation
  const { data: userPoints } = await supabase
    .from('user_points')
    .select('total_points')
    .eq('user_id', user.id)
    .single()

  // Fetch activities for progress tracking
  const { data: activities } = await supabase
    .from('activities')
    .select('category, type, value')
    .eq('user_id', user.id)

  type ActivityRow = { category: string; type: string; value: number }
  const typedActivities = (activities as ActivityRow[] | null) || []

  // Calculate progress for various achievements
  const totalActivities = typedActivities.length
  const bikeKm = typedActivities.filter(a => a.type === 'bike').reduce((sum, a) => sum + (a.value || 0), 0)
  const veganMeals = typedActivities.filter(a => a.type?.includes('vegan')).length
  const vegetarianMeals = typedActivities.filter(a => a.type?.includes('vegetarian') || a.type?.includes('vegan')).length
  const publicTransit = typedActivities.filter(a => a.type === 'bus' || a.type === 'train').length
  const solarDays = typedActivities.filter(a => a.type === 'solar').length
  const totalPoints = (userPoints as { total_points: number } | null)?.total_points || 0

  const progressData: Record<string, number> = {
    "1": totalActivities,
    "4": bikeKm,
    "5": vegetarianMeals,
    "8": totalPoints,
    "10": publicTransit,
    "11": veganMeals,
    "12": solarDays,
  }

  // Check for "First Steps" achievement
  if (totalActivities >= 1 && !unlockedIds.has("1")) {
    unlockedIds.add("1")
  }

  const categories = [...new Set(allAchievements.map(a => a.category))]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Achievements <Trophy className="h-8 w-8 text-yellow-500" />
        </h2>
        <p className="text-slate-500 mt-1">
          Track your eco milestones and earn badges
        </p>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="p-2 bg-emerald-100 rounded-full">
          <Target className="h-8 w-8 text-emerald-600" />
        </div>
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
                        "p-3 rounded-full flex items-center justify-center", 
                        isUnlocked ? "bg-green-100" : "bg-gray-200"
                      )}>
                        <achievement.icon className={cn("h-6 w-6", isUnlocked ? "text-green-600" : "text-gray-500")} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {achievement.name}
                          {isUnlocked && <Check className="h-4 w-4 text-green-600" />}
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
