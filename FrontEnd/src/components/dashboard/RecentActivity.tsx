import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Utensils, Zap, Bike, TreeDeciduous } from "lucide-react"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: 'transport' | 'diet' | 'energy'
  description: string
  impact: number
  timestamp: string
  icon?: string
}

interface RecentActivityProps {
  activities?: Activity[]
}

const defaultActivities: Activity[] = [
  { 
    id: "1", 
    type: "transport", 
    description: "Biked to work", 
    impact: -2.5, 
    timestamp: "2 hours ago" 
  },
  { 
    id: "2", 
    type: "diet", 
    description: "Vegetarian lunch", 
    impact: -1.2, 
    timestamp: "4 hours ago" 
  },
  { 
    id: "3", 
    type: "energy", 
    description: "Reduced AC usage", 
    impact: -0.8, 
    timestamp: "Yesterday" 
  },
  { 
    id: "4", 
    type: "transport", 
    description: "Carpooled to meeting", 
    impact: -1.5, 
    timestamp: "Yesterday" 
  },
  { 
    id: "5", 
    type: "diet", 
    description: "Local produce shopping", 
    impact: -0.5, 
    timestamp: "2 days ago" 
  },
]

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'transport':
      return Bike
    case 'diet':
      return Utensils
    case 'energy':
      return Zap
    default:
      return TreeDeciduous
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'transport':
      return "bg-blue-100 text-blue-600"
    case 'diet':
      return "bg-emerald-100 text-emerald-600"
    case 'energy':
      return "bg-amber-100 text-amber-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

export function RecentActivity({ activities = defaultActivities }: RecentActivityProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          Recent Activity
        </CardTitle>
        <p className="text-sm text-slate-500">
          Your latest eco-friendly actions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            const colorClass = getActivityColor(activity.type)
            
            return (
              <div 
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className={cn("p-2 rounded-full", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activity.timestamp}
                  </p>
                </div>
                <div className={cn(
                  "text-sm font-semibold",
                  activity.impact < 0 ? "text-emerald-600" : "text-red-500"
                )}>
                  {activity.impact < 0 ? "" : "+"}{activity.impact} kg
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
