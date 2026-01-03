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
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
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