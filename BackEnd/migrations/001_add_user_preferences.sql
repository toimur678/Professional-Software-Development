-- ============================================================================
-- EcoWisely Database Schema Update: User Preferences
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- ============================================================================

-- 1. Add user preference columns to profiles table
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS household_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'urban',
ADD COLUMN IF NOT EXISTS climate_zone TEXT DEFAULT 'temperate',
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS diet_preference TEXT DEFAULT 'omnivore',
ADD COLUMN IF NOT EXISTS home_type TEXT DEFAULT 'apartment',
ADD COLUMN IF NOT EXISTS renewable_energy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS income_bracket TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS commute_distance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS meals_out_weekly INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS sustainability_goal TEXT DEFAULT 'reduce_footprint',
ADD COLUMN IF NOT EXISTS focus_areas TEXT[] DEFAULT ARRAY['transport', 'diet', 'energy'],
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Add check constraints for valid values
-- ============================================================================

-- Location type constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_location_type;

ALTER TABLE profiles
ADD CONSTRAINT valid_location_type 
CHECK (location_type IN ('urban', 'suburban', 'rural'));

-- Vehicle type constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_vehicle_type;

ALTER TABLE profiles
ADD CONSTRAINT valid_vehicle_type 
CHECK (vehicle_type IN ('none', 'petrol', 'diesel', 'electric', 'hybrid'));

-- Diet preference constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_diet_preference;

ALTER TABLE profiles
ADD CONSTRAINT valid_diet_preference 
CHECK (diet_preference IN ('vegan', 'vegetarian', 'pescatarian', 'omnivore'));

-- Home type constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_home_type;

ALTER TABLE profiles
ADD CONSTRAINT valid_home_type 
CHECK (home_type IN ('apartment', 'house', 'shared'));

-- Income bracket constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_income_bracket;

ALTER TABLE profiles
ADD CONSTRAINT valid_income_bracket 
CHECK (income_bracket IN ('low', 'medium', 'high'));

-- Climate zone constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_climate_zone;

ALTER TABLE profiles
ADD CONSTRAINT valid_climate_zone 
CHECK (climate_zone IN ('temperate', 'tropical', 'cold', 'hot', 'mediterranean'));

-- Sustainability goal constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_sustainability_goal;

ALTER TABLE profiles
ADD CONSTRAINT valid_sustainability_goal 
CHECK (sustainability_goal IN ('reduce_footprint', 'save_money', 'health', 'environment', 'all'));

-- Household size constraint (1-10)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_household_size;

ALTER TABLE profiles
ADD CONSTRAINT valid_household_size 
CHECK (household_size >= 1 AND household_size <= 10);

-- 3. Create indexes for frequently queried columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_location_type ON profiles(location_type);
CREATE INDEX IF NOT EXISTS idx_profiles_vehicle_type ON profiles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_profiles_diet_preference ON profiles(diet_preference);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- 4. Create user_recommendations table for tracking accepted recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recommendation_action TEXT NOT NULL,
    confidence NUMERIC,
    reasoning TEXT,
    recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'dismissed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    actual_savings_kg NUMERIC DEFAULT 0,
    target_savings_kg NUMERIC DEFAULT 0,
    model_used TEXT,
    model_accuracy NUMERIC
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_status ON user_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_recommended_at ON user_recommendations(recommended_at);

-- 5. Enable Row Level Security
-- ============================================================================

ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own recommendations
DROP POLICY IF EXISTS "Users can view own recommendations" ON user_recommendations;
CREATE POLICY "Users can view own recommendations" ON user_recommendations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own recommendations
DROP POLICY IF EXISTS "Users can insert own recommendations" ON user_recommendations;
CREATE POLICY "Users can insert own recommendations" ON user_recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own recommendations
DROP POLICY IF EXISTS "Users can update own recommendations" ON user_recommendations;
CREATE POLICY "Users can update own recommendations" ON user_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON user_recommendations TO authenticated;

-- 7. Verification queries (run these to verify changes)
-- ============================================================================

-- Check new columns exist
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- Check user_recommendations table
-- SELECT * FROM user_recommendations LIMIT 5;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
