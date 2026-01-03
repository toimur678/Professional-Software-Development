import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Car, Utensils, Zap, Leaf, ArrowRight, CheckCircle2, Lightbulb, Globe, Sparkles, AlertCircle, TrendingDown, BarChart3, Target, Info } from "lucide-react"
import { AI_RECOMMENDATION_DETAILS, AIRecommendationDetail } from "@/lib/recommendations/ai-mapping"
import { Progress } from "@/components/ui/progress"

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'transport' | 'diet' | 'energy' | 'general'
  impact: 'high' | 'medium' | 'low'
  potentialSaving: string
  isCompleted?: boolean
}

interface EnhancedAIRecommendationResponse {
  recommended_action: string;
  confidence: number;
  category: string;
  reasoning: string;
  estimated_weekly_impact_kg: number;
  difficulty: string;
  alternatives: string[];
  emission_breakdown: {
    transport_pct: number;
    diet_pct: number;
    energy_pct: number;
  };
  highest_impact_category: string;
  input_stats: {
    transport_kg: number;
    diet_kg: number;
    energy_kg: number;
    total_kg: number;
  };
  user_context_applied: boolean;
  model_type: string;
  top_predictions?: Array<{
    recommendation: string;
    confidence: number;
  }>;
}

async function getEnhancedAIRecommendation(): Promise<EnhancedAIRecommendationResponse | null> {
  try {
    // In production, get user context from Supabase
    const response = await fetch("http://127.0.0.1:8000/predict/enhanced", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transport_kg: 12,
        diet_kg: 5,
        energy_kg: 8,
        // Add user context for personalization
        household_size: 3,
        location_type: "suburban",
        vehicle_type: "petrol",
        diet_preference: "omnivore",
        home_type: "house",
        renewable_energy: false,
        commute_distance: 25,
        meals_out_weekly: 3,
        season: "summer",
        climate_zone: "temperate"
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Enhanced AI Recommendation API error:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch enhanced AI recommendation:", error);
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

// AI Recommendation Card Component - Enhanced Version
function EnhancedAIRecommendationCard({ 
  recommendation
}: { 
  recommendation: EnhancedAIRecommendationResponse;
}) {
  const category = recommendation.category as 'transport' | 'diet' | 'energy' | 'general';
  const Icon = getCategoryIcon(category);
  const colorClass = getCategoryColor(category);
  
  // Map difficulty to impact level for styling
  const impactMap: Record<string, 'high' | 'medium' | 'low'> = {
    'easy': 'low',
    'medium': 'medium', 
    'high': 'high'
  };
  const impact = impactMap[recommendation.difficulty] || 'medium';
  const impactClass = getImpactBadge(impact);
  
  // Get confidence color
  const confidenceColor = recommendation.confidence >= 0.8 
    ? 'text-green-600' 
    : recommendation.confidence >= 0.6 
      ? 'text-yellow-600' 
      : 'text-red-600';

  // Get title from AI mapping or format from action name
  const details = AI_RECOMMENDATION_DETAILS[recommendation.recommended_action];
  const title = details?.title || recommendation.recommended_action.replace(/_/g, " ");

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
              AI-Powered Recommendation
            </span>
          </div>
          {recommendation.user_context_applied && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Personalized
            </span>
          )}
        </div>
        
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full border capitalize",
              impactClass
            )}>
              {recommendation.difficulty} difficulty
            </span>
          </div>
        </div>
        
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
        <CardDescription className="text-base">
          {recommendation.reasoning}
        </CardDescription>
        
        {/* Confidence Indicator */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-1">
              <Target className="h-4 w-4" />
              Confidence
            </span>
            <span className={cn("font-medium", confidenceColor)}>
              {(recommendation.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={recommendation.confidence * 100} className="h-2" />
        </div>
        
        {/* Emission Breakdown */}
        <div className="mt-4 p-3 bg-white/50 rounded-lg">
          <div className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
            <BarChart3 className="h-4 w-4" />
            Your Emission Breakdown
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className={cn(
              "p-2 rounded",
              recommendation.highest_impact_category === 'transport' ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-slate-100'
            )}>
              <Car className="h-4 w-4 mx-auto text-blue-600" />
              <div className="font-medium">{recommendation.emission_breakdown.transport_pct}%</div>
              <div className="text-xs text-slate-500">Transport</div>
            </div>
            <div className={cn(
              "p-2 rounded",
              recommendation.highest_impact_category === 'diet' ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-slate-100'
            )}>
              <Utensils className="h-4 w-4 mx-auto text-emerald-600" />
              <div className="font-medium">{recommendation.emission_breakdown.diet_pct}%</div>
              <div className="text-xs text-slate-500">Diet</div>
            </div>
            <div className={cn(
              "p-2 rounded",
              recommendation.highest_impact_category === 'energy' ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-slate-100'
            )}>
              <Zap className="h-4 w-4 mx-auto text-amber-600" />
              <div className="font-medium">{recommendation.emission_breakdown.energy_pct}%</div>
              <div className="text-xs text-slate-500">Energy</div>
            </div>
          </div>
        </div>
        
        {/* Top Predictions */}
        {recommendation.top_predictions && recommendation.top_predictions.length > 1 && (
          <div className="mt-4">
            <div className="text-sm text-slate-600 mb-2 flex items-center gap-1">
              <Info className="h-4 w-4" />
              Alternative Recommendations
            </div>
            <div className="space-y-1">
              {recommendation.top_predictions.slice(1, 3).map((pred, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-white/30 p-2 rounded">
                  <span className="text-slate-700">{pred.recommendation.replace(/_/g, " ")}</span>
                  <span className="text-slate-500">{(pred.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex items-center gap-1 text-sm text-purple-600 font-medium">
          <TrendingDown className="h-4 w-4" />
          Save ~{recommendation.estimated_weekly_impact_kg} kg CO₂/week
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
  // Fetch enhanced AI recommendation with user context
  const aiRecommendation = await getEnhancedAIRecommendation();

  const activeRecommendations = recommendations.filter(r => !r.isCompleted)
  const completedRecommendations = recommendations.filter(r => r.isCompleted)
  
  // Calculate total potential savings
  const totalPotentialSavings = aiRecommendation 
    ? aiRecommendation.estimated_weekly_impact_kg + 10.5 // AI + other recommendations
    : 15.5;

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
          <EnhancedAIRecommendationCard recommendation={aiRecommendation} />
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
              <p className="text-3xl font-bold mt-1">~{totalPotentialSavings.toFixed(1)} kg CO₂</p>
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
