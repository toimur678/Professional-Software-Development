export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          // User preferences for personalized recommendations
          household_size: number | null
          location_type: 'urban' | 'suburban' | 'rural' | null
          climate_zone: 'temperate' | 'tropical' | 'cold' | 'hot' | 'mediterranean' | null
          vehicle_type: 'none' | 'petrol' | 'diesel' | 'electric' | 'hybrid' | null
          diet_preference: 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore' | null
          home_type: 'apartment' | 'house' | 'shared' | null
          renewable_energy: boolean | null
          income_bracket: 'low' | 'medium' | 'high' | null
          commute_distance: number | null
          meals_out_weekly: number | null
          sustainability_goal: 'reduce_50' | 'carbon_neutral' | 'sustainable_lifestyle' | 'learn_impact' | null
          focus_areas: string[] | null
          onboarding_completed: boolean | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          household_size?: number | null
          location_type?: 'urban' | 'suburban' | 'rural' | null
          climate_zone?: 'temperate' | 'tropical' | 'cold' | 'hot' | 'mediterranean' | null
          vehicle_type?: 'none' | 'petrol' | 'diesel' | 'electric' | 'hybrid' | null
          diet_preference?: 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore' | null
          home_type?: 'apartment' | 'house' | 'shared' | null
          renewable_energy?: boolean | null
          income_bracket?: 'low' | 'medium' | 'high' | null
          commute_distance?: number | null
          meals_out_weekly?: number | null
          sustainability_goal?: 'reduce_50' | 'carbon_neutral' | 'sustainable_lifestyle' | 'learn_impact' | null
          focus_areas?: string[] | null
          onboarding_completed?: boolean | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          household_size?: number | null
          location_type?: 'urban' | 'suburban' | 'rural' | null
          climate_zone?: 'temperate' | 'tropical' | 'cold' | 'hot' | 'mediterranean' | null
          vehicle_type?: 'none' | 'petrol' | 'diesel' | 'electric' | 'hybrid' | null
          diet_preference?: 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore' | null
          home_type?: 'apartment' | 'house' | 'shared' | null
          renewable_energy?: boolean | null
          income_bracket?: 'low' | 'medium' | 'high' | null
          commute_distance?: number | null
          meals_out_weekly?: number | null
          sustainability_goal?: 'reduce_50' | 'carbon_neutral' | 'sustainable_lifestyle' | 'learn_impact' | null
          focus_areas?: string[] | null
          onboarding_completed?: boolean | null
        }
        Relationships: []
      }
      user_recommendations: {
        Row: {
          id: string
          user_id: string
          recommendation: string
          category: string
          confidence: number
          estimated_impact_kg: number
          status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          recommendation: string
          category: string
          confidence: number
          estimated_impact_kg: number
          status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          recommendation?: string
          category?: string
          confidence?: number
          estimated_impact_kg?: number
          status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          user_id: string
          date: string
          category: string
          type: string
          value: number
          co2_kg: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          category: string
          type: string
          value: number
          co2_kg: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          category?: string
          type?: string
          value?: number
          co2_kg?: number
          created_at?: string
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          id: string
          user_id: string
          date: string
          transport_co2: number
          diet_co2: number
          energy_co2: number
          total_co2: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          transport_co2?: number
          diet_co2?: number
          energy_co2?: number
          total_co2?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          transport_co2?: number
          diet_co2?: number
          energy_co2?: number
          total_co2?: number
        }
        Relationships: []
      }
      user_points: {
        Row: {
          user_id: string
          total_points: number
          level: number
          trees_planted: number
        }
        Insert: {
          user_id: string
          total_points?: number
          level?: number
          trees_planted?: number
        }
        Update: {
          user_id?: string
          total_points?: number
          level?: number
          trees_planted?: number
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          points_required: number | null
          category: string | null
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          icon?: string | null
          points_required?: number | null
          category?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          points_required?: number | null
          category?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      // ============================================================================
      // Social Features Tables
      // ============================================================================
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          created_by: string | null
          created_at: string
          is_public: boolean
          max_members: number
          total_co2_saved: number
          weekly_co2_saved: number
          invite_code: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_at?: string
          is_public?: boolean
          max_members?: number
          total_co2_saved?: number
          weekly_co2_saved?: number
          invite_code?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_at?: string
          is_public?: boolean
          max_members?: number
          total_co2_saved?: number
          weekly_co2_saved?: number
          invite_code?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
          contribution_co2: number
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          contribution_co2?: number
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          contribution_co2?: number
        }
        Relationships: []
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          created_at?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          responded_at?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          category: 'transport' | 'diet' | 'energy' | 'general' | 'team'
          challenge_type: 'individual' | 'team' | 'global'
          target_value: number
          target_unit: string
          start_date: string
          end_date: string
          points_reward: number
          badge_reward: string | null
          created_by: string | null
          created_at: string
          is_active: boolean
          difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
          team_id: string | null
          max_participants: number | null
          min_participants: number
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: 'transport' | 'diet' | 'energy' | 'general' | 'team'
          challenge_type: 'individual' | 'team' | 'global'
          target_value: number
          target_unit: string
          start_date: string
          end_date: string
          points_reward?: number
          badge_reward?: string | null
          created_by?: string | null
          created_at?: string
          is_active?: boolean
          difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'
          team_id?: string | null
          max_participants?: number | null
          min_participants?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: 'transport' | 'diet' | 'energy' | 'general' | 'team'
          challenge_type?: 'individual' | 'team' | 'global'
          target_value?: number
          target_unit?: string
          start_date?: string
          end_date?: string
          points_reward?: number
          badge_reward?: string | null
          created_by?: string | null
          created_at?: string
          is_active?: boolean
          difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'
          team_id?: string | null
          max_participants?: number | null
          min_participants?: number
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          team_id: string | null
          current_progress: number
          completed: boolean
          completed_at: string | null
          rank: number | null
          joined_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          team_id?: string | null
          current_progress?: number
          completed?: boolean
          completed_at?: string | null
          rank?: number | null
          joined_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          team_id?: string | null
          current_progress?: number
          completed?: boolean
          completed_at?: string | null
          rank?: number | null
          joined_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'friend_request' | 'friend_accepted' | 'team_invite' | 'team_joined' | 'team_left' | 'challenge_invite' | 'challenge_started' | 'challenge_completed' | 'challenge_ended' | 'achievement_unlocked' | 'level_up' | 'leaderboard_rank_up' | 'leaderboard_rank_down' | 'weekly_summary' | 'streak_reminder' | 'system'
          title: string
          message: string | null
          related_user_id: string | null
          related_team_id: string | null
          related_challenge_id: string | null
          read: boolean
          read_at: string | null
          created_at: string
          action_url: string | null
          icon: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
        }
        Insert: {
          id?: string
          user_id: string
          type: 'friend_request' | 'friend_accepted' | 'team_invite' | 'team_joined' | 'team_left' | 'challenge_invite' | 'challenge_started' | 'challenge_completed' | 'challenge_ended' | 'achievement_unlocked' | 'level_up' | 'leaderboard_rank_up' | 'leaderboard_rank_down' | 'weekly_summary' | 'streak_reminder' | 'system'
          title: string
          message?: string | null
          related_user_id?: string | null
          related_team_id?: string | null
          related_challenge_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
          action_url?: string | null
          icon?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'friend_request' | 'friend_accepted' | 'team_invite' | 'team_joined' | 'team_left' | 'challenge_invite' | 'challenge_started' | 'challenge_completed' | 'challenge_ended' | 'achievement_unlocked' | 'level_up' | 'leaderboard_rank_up' | 'leaderboard_rank_down' | 'weekly_summary' | 'streak_reminder' | 'system'
          title?: string
          message?: string | null
          related_user_id?: string | null
          related_team_id?: string | null
          related_challenge_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
          action_url?: string | null
          icon?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
        }
        Relationships: []
      }
      leaderboard_cache: {
        Row: {
          id: string
          scope: 'global' | 'friends' | 'team'
          scope_id: string | null
          period: 'daily' | 'weekly' | 'monthly' | 'all_time'
          user_id: string
          rank: number
          co2_saved: number
          points: number
          activities_count: number
          streak_days: number
          cached_at: string
        }
        Insert: {
          id?: string
          scope: 'global' | 'friends' | 'team'
          scope_id?: string | null
          period: 'daily' | 'weekly' | 'monthly' | 'all_time'
          user_id: string
          rank: number
          co2_saved?: number
          points?: number
          activities_count?: number
          streak_days?: number
          cached_at?: string
        }
        Update: {
          id?: string
          scope?: 'global' | 'friends' | 'team'
          scope_id?: string | null
          period?: 'daily' | 'weekly' | 'monthly' | 'all_time'
          user_id?: string
          rank?: number
          co2_saved?: number
          points?: number
          activities_count?: number
          streak_days?: number
          cached_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}