export interface AIRecommendationDetail {
  title: string;
  description: string;
  category: 'transport' | 'diet' | 'energy';
  impact: 'high' | 'medium' | 'low';
  potentialSaving: string;
}

export const AI_RECOMMENDATION_DETAILS: Record<string, AIRecommendationDetail> = {
  Carpool_More: {
    title: "Start Carpooling",
    description: "Share rides with colleagues or neighbors to reduce individual vehicle emissions and save on fuel costs.",
    category: "transport",
    impact: "high",
    potentialSaving: "4.0 kg CO₂/week",
  },
  Switch_to_Public_Transit: {
    title: "Switch to Public Transit",
    description: "Use buses, trains, or subways instead of driving. Public transit produces significantly fewer emissions per passenger.",
    category: "transport",
    impact: "high",
    potentialSaving: "3.5 kg CO₂/week",
  },
  Meatless_Monday: {
    title: "Try Meatless Mondays",
    description: "Reduce meat consumption by going vegetarian one day per week. Meat production is a major source of greenhouse gases.",
    category: "diet",
    impact: "medium",
    potentialSaving: "1.8 kg CO₂/week",
  },
  Install_Smart_Thermostat: {
    title: "Install a Smart Thermostat",
    description: "Optimize your home heating and cooling with a smart thermostat to reduce energy waste when you're away or sleeping.",
    category: "energy",
    impact: "medium",
    potentialSaving: "2.2 kg CO₂/week",
  },
  General_Reduction: {
    title: "General Emission Reduction",
    description: "Focus on small daily changes: turn off lights, reduce water usage, and be mindful of your overall consumption patterns.",
    category: "energy",
    impact: "low",
    potentialSaving: "1.0 kg CO₂/week",
  },
};
