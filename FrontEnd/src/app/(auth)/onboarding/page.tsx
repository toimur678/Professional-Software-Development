'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Leaf,
  Car,
  Utensils,
  Home,
  Target,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  MapPin,
  Users,
  Zap
} from 'lucide-react';

interface OnboardingData {
  household_size: number;
  location_type: 'urban' | 'suburban' | 'rural' | null;
  climate_zone: 'temperate' | 'tropical' | 'cold' | 'hot' | 'mediterranean' | null;
  vehicle_type: 'none' | 'petrol' | 'diesel' | 'electric' | 'hybrid' | null;
  diet_preference: 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore' | null;
  home_type: 'apartment' | 'house' | 'shared' | null;
  renewable_energy: boolean;
  commute_distance: number;
  meals_out_weekly: number;
  sustainability_goal: 'reduce_50' | 'carbon_neutral' | 'sustainable_lifestyle' | 'learn_impact' | null;
  focus_areas: string[];
}

const STEPS = [
  { id: 1, title: 'Welcome', icon: Leaf },
  { id: 2, title: 'Household', icon: Users },
  { id: 3, title: 'Transportation', icon: Car },
  { id: 4, title: 'Diet & Home', icon: Home },
  { id: 5, title: 'Goals', icon: Target },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    household_size: 2,
    location_type: null,
    climate_zone: null,
    vehicle_type: null,
    diet_preference: null,
    home_type: null,
    renewable_energy: false,
    commute_distance: 15,
    meals_out_weekly: 2,
    sustainability_goal: null,
    focus_areas: [],
  });

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const toggleFocusArea = (area: string) => {
    setData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...data,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  const SelectButton = ({ 
    selected, 
    onClick, 
    children,
    icon: Icon
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left w-full ${
        selected 
          ? 'border-green-500 bg-green-50 text-green-700' 
          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
      }`}
    >
      {Icon && <Icon className={`w-5 h-5 ${selected ? 'text-green-600' : 'text-gray-400'}`} />}
      <span className="font-medium">{children}</span>
      {selected && <CheckCircle className="w-5 h-5 ml-auto text-green-600" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        {/* Progress Header */}
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-lg text-green-700">EcoWisely</span>
            </div>
            <span className="text-sm text-gray-500">Step {currentStep} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    step.id === currentStep ? 'text-green-600' : 
                    step.id < currentStep ? 'text-green-400' : 'text-gray-300'
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                  <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Leaf className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">Welcome to EcoWisely!</CardTitle>
                <CardDescription className="text-base">
                  Let&apos;s personalize your experience to help you track and reduce your carbon footprint more effectively.
                </CardDescription>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-green-700 mb-2">What we&apos;ll cover:</h4>
                <ul className="space-y-2 text-sm text-green-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Your household details
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Transportation habits
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Diet and home preferences
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Your sustainability goals
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500">
                This takes about 2 minutes and helps us provide better recommendations.
              </p>
            </div>
          )}

          {/* Step 2: Household */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="text-xl mb-2">About Your Household</CardTitle>
                <CardDescription>Tell us about where and how you live.</CardDescription>
              </div>

              {/* Household Size */}
              <div className="space-y-3">
                <Label>How many people live in your household?</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={data.household_size}
                    onChange={(e) => updateData('household_size', parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Location Type */}
              <div className="space-y-3">
                <Label>Where do you live?</Label>
                <div className="grid gap-2">
                  <SelectButton
                    selected={data.location_type === 'urban'}
                    onClick={() => updateData('location_type', 'urban')}
                    icon={MapPin}
                  >
                    Urban - City center with good public transit
                  </SelectButton>
                  <SelectButton
                    selected={data.location_type === 'suburban'}
                    onClick={() => updateData('location_type', 'suburban')}
                    icon={MapPin}
                  >
                    Suburban - Residential area, some transit
                  </SelectButton>
                  <SelectButton
                    selected={data.location_type === 'rural'}
                    onClick={() => updateData('location_type', 'rural')}
                    icon={MapPin}
                  >
                    Rural - Countryside, limited transit
                  </SelectButton>
                </div>
              </div>

              {/* Climate Zone */}
              <div className="space-y-3">
                <Label>What&apos;s your climate like?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['temperate', 'tropical', 'cold', 'hot', 'mediterranean'] as const).map((zone) => (
                    <SelectButton
                      key={zone}
                      selected={data.climate_zone === zone}
                      onClick={() => updateData('climate_zone', zone)}
                    >
                      {zone.charAt(0).toUpperCase() + zone.slice(1)}
                    </SelectButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Transportation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="text-xl mb-2">Your Transportation</CardTitle>
                <CardDescription>How do you usually get around?</CardDescription>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-3">
                <Label>What&apos;s your primary vehicle?</Label>
                <div className="grid gap-2">
                  <SelectButton
                    selected={data.vehicle_type === 'none'}
                    onClick={() => updateData('vehicle_type', 'none')}
                    icon={Car}
                  >
                    No car - I use public transit, bike, or walk
                  </SelectButton>
                  <SelectButton
                    selected={data.vehicle_type === 'petrol'}
                    onClick={() => updateData('vehicle_type', 'petrol')}
                    icon={Car}
                  >
                    Petrol/Gasoline vehicle
                  </SelectButton>
                  <SelectButton
                    selected={data.vehicle_type === 'diesel'}
                    onClick={() => updateData('vehicle_type', 'diesel')}
                    icon={Car}
                  >
                    Diesel vehicle
                  </SelectButton>
                  <SelectButton
                    selected={data.vehicle_type === 'hybrid'}
                    onClick={() => updateData('vehicle_type', 'hybrid')}
                    icon={Car}
                  >
                    Hybrid vehicle
                  </SelectButton>
                  <SelectButton
                    selected={data.vehicle_type === 'electric'}
                    onClick={() => updateData('vehicle_type', 'electric')}
                    icon={Zap}
                  >
                    Electric vehicle (EV)
                  </SelectButton>
                </div>
              </div>

              {/* Commute Distance */}
              {data.vehicle_type !== 'none' && (
                <div className="space-y-3">
                  <Label>Average daily commute distance (km)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      value={data.commute_distance}
                      onChange={(e) => updateData('commute_distance', parseInt(e.target.value) || 0)}
                      className="w-32"
                    />
                    <span className="text-gray-500">km</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Diet & Home */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="text-xl mb-2">Diet & Home</CardTitle>
                <CardDescription>Your eating habits and home energy use.</CardDescription>
              </div>

              {/* Diet Preference */}
              <div className="space-y-3">
                <Label>What best describes your diet?</Label>
                <div className="grid gap-2">
                  <SelectButton
                    selected={data.diet_preference === 'vegan'}
                    onClick={() => updateData('diet_preference', 'vegan')}
                    icon={Utensils}
                  >
                    Vegan - No animal products
                  </SelectButton>
                  <SelectButton
                    selected={data.diet_preference === 'vegetarian'}
                    onClick={() => updateData('diet_preference', 'vegetarian')}
                    icon={Utensils}
                  >
                    Vegetarian - No meat, but dairy/eggs
                  </SelectButton>
                  <SelectButton
                    selected={data.diet_preference === 'pescatarian'}
                    onClick={() => updateData('diet_preference', 'pescatarian')}
                    icon={Utensils}
                  >
                    Pescatarian - Fish but no meat
                  </SelectButton>
                  <SelectButton
                    selected={data.diet_preference === 'omnivore'}
                    onClick={() => updateData('diet_preference', 'omnivore')}
                    icon={Utensils}
                  >
                    Omnivore - I eat everything
                  </SelectButton>
                </div>
              </div>

              {/* Meals Out */}
              <div className="space-y-3">
                <Label>How many meals do you eat out per week?</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={0}
                    max={21}
                    value={data.meals_out_weekly}
                    onChange={(e) => updateData('meals_out_weekly', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-gray-500">meals/week</span>
                </div>
              </div>

              {/* Home Type */}
              <div className="space-y-3">
                <Label>What type of home do you live in?</Label>
                <div className="grid gap-2">
                  <SelectButton
                    selected={data.home_type === 'apartment'}
                    onClick={() => updateData('home_type', 'apartment')}
                    icon={Home}
                  >
                    Apartment/Condo
                  </SelectButton>
                  <SelectButton
                    selected={data.home_type === 'house'}
                    onClick={() => updateData('home_type', 'house')}
                    icon={Home}
                  >
                    House
                  </SelectButton>
                  <SelectButton
                    selected={data.home_type === 'shared'}
                    onClick={() => updateData('home_type', 'shared')}
                    icon={Home}
                  >
                    Shared housing
                  </SelectButton>
                </div>
              </div>

              {/* Renewable Energy */}
              <div className="space-y-3">
                <Label>Do you use renewable energy?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <SelectButton
                    selected={data.renewable_energy === true}
                    onClick={() => updateData('renewable_energy', true)}
                    icon={Zap}
                  >
                    Yes, solar/wind/green
                  </SelectButton>
                  <SelectButton
                    selected={data.renewable_energy === false}
                    onClick={() => updateData('renewable_energy', false)}
                  >
                    No, standard grid
                  </SelectButton>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Goals */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="text-xl mb-2">Your Goals</CardTitle>
                <CardDescription>What do you want to achieve with EcoWisely?</CardDescription>
              </div>

              {/* Sustainability Goal */}
              <div className="space-y-3">
                <Label>What&apos;s your main sustainability goal?</Label>
                <div className="grid gap-2">
                  <SelectButton
                    selected={data.sustainability_goal === 'reduce_50'}
                    onClick={() => updateData('sustainability_goal', 'reduce_50')}
                    icon={Target}
                  >
                    Reduce my carbon footprint by 50%
                  </SelectButton>
                  <SelectButton
                    selected={data.sustainability_goal === 'carbon_neutral'}
                    onClick={() => updateData('sustainability_goal', 'carbon_neutral')}
                    icon={Target}
                  >
                    Become carbon neutral
                  </SelectButton>
                  <SelectButton
                    selected={data.sustainability_goal === 'sustainable_lifestyle'}
                    onClick={() => updateData('sustainability_goal', 'sustainable_lifestyle')}
                    icon={Target}
                  >
                    Live a more sustainable lifestyle
                  </SelectButton>
                  <SelectButton
                    selected={data.sustainability_goal === 'learn_impact'}
                    onClick={() => updateData('sustainability_goal', 'learn_impact')}
                    icon={Target}
                  >
                    Just learn about my environmental impact
                  </SelectButton>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="space-y-3">
                <Label>Which areas do you want to focus on? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'transport', label: 'Transportation', icon: Car },
                    { key: 'diet', label: 'Diet & Food', icon: Utensils },
                    { key: 'energy', label: 'Home Energy', icon: Zap },
                    { key: 'shopping', label: 'Shopping', icon: Target },
                    { key: 'waste', label: 'Waste Reduction', icon: Leaf },
                    { key: 'water', label: 'Water Usage', icon: Home },
                  ].map((area) => (
                    <SelectButton
                      key={area.key}
                      selected={data.focus_areas.includes(area.key)}
                      onClick={() => toggleFocusArea(area.key)}
                      icon={area.icon}
                    >
                      {area.label}
                    </SelectButton>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  You&apos;re all set!
                </h4>
                <p className="text-sm text-green-600">
                  Based on your preferences, we&apos;ll provide personalized recommendations to help you achieve your sustainability goals.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
