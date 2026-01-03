import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Car, Utensils, Zap, Leaf, ArrowRight, CheckCircle2, Lightbulb, Globe, Sparkles, AlertCircle } from "lucide-react"
import { AI_RECOMMENDATION_DETAILS, AIRecommendationDetail } from "@/lib/recommendations/ai-mapping"

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'transport' | 'diet' | 'energy' | 'general'
  impact: 'high' | 'medium' | 'low'
  potentialSaving: string
  isCompleted?: boolean
}

interface AIRecommendationResponse {
  recommended_action: string;
  input_stats: {
    transport_kg: number;
    diet_kg: number;
    energy_kg: number;
  };
  total_emissions: number;
}

async function getAIRecommendation(userId: string): Promise<AIRecommendationResponse | null> {
  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transport_kg: 12,
        diet_kg: 2,
        energy_kg: 3,
      }),
      // Disable caching for fresh recommendations
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("AI Recommendation API error:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch AI recommendation:", error);
    return null;
  }
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

// AI Recommendation Card Component
function AIRecommendationCard({ 
  recommendation, 
  details 
}: { 
  recommendation: AIRecommendationResponse; 
  details: AIRecommendationDetail | null;
}) {
  const Icon = details ? getCategoryIcon(details.category) : Sparkles;
  const colorClass = details ? getCategoryColor(details.category) : "text-purple-600 bg-purple-100";
  const impactClass = details ? getImpactBadge(details.impact) : "bg-purple-100 text-purple-700 border-purple-200";

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
            AI-Powered Recommendation
          </span>
        </div>
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          {details && (
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full border capitalize",
              impactClass
            )}>
              {details.impact} impact
            </span>
          )}
        </div>
        <CardTitle className="text-lg mt-3">
          {details?.title || recommendation.recommended_action.replace(/_/g, " ")}
        </CardTitle>
        <CardDescription className="text-base">
          {details?.description || `Based on your emissions (${recommendation.total_emissions.toFixed(1)} kg CO₂), we recommend focusing on this area.`}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex items-center gap-1 text-sm text-purple-600 font-medium">
          <Leaf className="h-4 w-4" />
          {details?.potentialSaving || "Significant savings potential"}
        </div>
        <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
          Get Started <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Fallback when AI service is unavailable
function AIServiceUnavailable() {
  return (
    <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-slate-500">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">AI Recommendations Unavailable</p>
            <p className="text-sm">The AI service is currently offline. Check back later for personalized recommendations.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function RecommendationsPage() {
  // Fetch AI recommendation (using a placeholder userId for now)
  const aiRecommendation = await getAIRecommendation("user-123");
  const aiDetails = aiRecommendation 
    ? AI_RECOMMENDATION_DETAILS[aiRecommendation.recommended_action] || null 
    : null;

  const activeRecommendations = recommendations.filter(r => !r.isCompleted)
  const completedRecommendations = recommendations.filter(r => r.isCompleted)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Recommendations <Lightbulb className="h-8 w-8 text-yellow-500" />
        </h2>
        <p className="text-slate-500 mt-1">
          Personalized tips to reduce your carbon footprint
        </p>
      </div>

      {/* Top AI Recommendation */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Top AI Recommendation
        </h3>
        {aiRecommendation ? (
          <AIRecommendationCard recommendation={aiRecommendation} details={aiDetails} />
        ) : (
          <AIServiceUnavailable />
        )}
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
            <Globe className="h-24 w-24 opacity-30" />
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
