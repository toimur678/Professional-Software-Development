import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Car, Utensils, Zap, Leaf, ArrowRight, CheckCircle2 } from "lucide-react"

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'transport' | 'diet' | 'energy' | 'general'
  impact: 'high' | 'medium' | 'low'
  potentialSaving: string
  isCompleted?: boolean
}

const recommendations: Recommendation[] = [
  {
    id: "1",
    title: "Switch to cycling for short trips",
    description: "For trips under 5km, consider cycling instead of driving. It's healthier and eco-friendly!",
    category: "transport",
    impact: "high",
    potentialSaving: "2.5 kg CO₂/week",
  },
  {
    id: "2",
    title: "Try Meatless Mondays",
    description: "Reduce your meat consumption by having one meat-free day per week.",
    category: "diet",
    impact: "medium",
    potentialSaving: "1.8 kg CO₂/week",
  },
  {
    id: "3",
    title: "Unplug devices when not in use",
    description: "Standby power can account for up to 10% of your electricity bill. Unplug chargers and devices.",
    category: "energy",
    impact: "low",
    potentialSaving: "0.5 kg CO₂/week",
  },
  {
    id: "4",
    title: "Use public transportation",
    description: "Taking the bus or train instead of driving can significantly reduce your carbon footprint.",
    category: "transport",
    impact: "high",
    potentialSaving: "3.2 kg CO₂/week",
    isCompleted: true,
  },
  {
    id: "5",
    title: "Buy local produce",
    description: "Locally sourced food has a lower carbon footprint due to reduced transportation.",
    category: "diet",
    impact: "medium",
    potentialSaving: "1.2 kg CO₂/week",
  },
  {
    id: "6",
    title: "Switch to LED bulbs",
    description: "LED bulbs use 75% less energy than traditional incandescent bulbs.",
    category: "energy",
    impact: "medium",
    potentialSaving: "0.8 kg CO₂/week",
    isCompleted: true,
  },
  {
    id: "7",
    title: "Carpool to work",
    description: "Share rides with colleagues to reduce emissions and save on fuel costs.",
    category: "transport",
    impact: "high",
    potentialSaving: "4.0 kg CO₂/week",
  },
  {
    id: "8",
    title: "Reduce food waste",
    description: "Plan your meals and store food properly to minimize waste.",
    category: "diet",
    impact: "medium",
    potentialSaving: "1.5 kg CO₂/week",
  },
]

const getCategoryIcon = (category: Recommendation['category']) => {
  switch (category) {
    case 'transport':
      return Car
    case 'diet':
      return Utensils
    case 'energy':
      return Zap
    default:
      return Leaf
  }
}

const getCategoryColor = (category: Recommendation['category']) => {
  switch (category) {
    case 'transport':
      return "text-blue-600 bg-blue-100"
    case 'diet':
      return "text-emerald-600 bg-emerald-100"
    case 'energy':
      return "text-amber-600 bg-amber-100"
    default:
      return "text-green-600 bg-green-100"
  }
}

const getImpactBadge = (impact: Recommendation['impact']) => {
  switch (impact) {
    case 'high':
      return "bg-red-100 text-red-700 border-red-200"
    case 'medium':
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case 'low':
      return "bg-green-100 text-green-700 border-green-200"
  }
}

export default function RecommendationsPage() {
  const activeRecommendations = recommendations.filter(r => !r.isCompleted)
  const completedRecommendations = recommendations.filter(r => r.isCompleted)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Recommendations 💡
        </h2>
        <p className="text-slate-500 mt-1">
          Personalized tips to reduce your carbon footprint
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Potential Weekly Savings</p>
              <p className="text-3xl font-bold mt-1">~15.5 kg CO₂</p>
              <p className="text-emerald-100 text-sm mt-2">
                By following all active recommendations
              </p>
            </div>
            <div className="text-6xl opacity-30">🌍</div>
          </div>
        </CardContent>
      </Card>

      {/* Active Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Active Recommendations ({activeRecommendations.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {activeRecommendations.map((rec) => {
            const Icon = getCategoryIcon(rec.category)
            const colorClass = getCategoryColor(rec.category)
            const impactClass = getImpactBadge(rec.impact)

            return (
              <Card key={rec.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-2 rounded-lg", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full border capitalize",
                      impactClass
                    )}>
                      {rec.impact} impact
                    </span>
                  </div>
                  <CardTitle className="text-base mt-3">{rec.title}</CardTitle>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between pt-0">
                  <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                    <Leaf className="h-4 w-4" />
                    {rec.potentialSaving}
                  </div>
                  <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                    Start <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Completed Recommendations */}
      {completedRecommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Completed ({completedRecommendations.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {completedRecommendations.map((rec) => {
              const Icon = getCategoryIcon(rec.category)

              return (
                <Card key={rec.id} className="bg-slate-50 border-dashed opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-slate-200 text-slate-500">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <CardTitle className="text-base mt-3 text-slate-600 line-through">
                      {rec.title}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {rec.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
