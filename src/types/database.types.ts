export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired' | 'canceled';
export type PanicOutcome = 'made_it' | 'relapsed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          subscription_status: SubscriptionStatus;
          timezone: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          subscription_status?: SubscriptionStatus;
          timezone?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subscription_status?: SubscriptionStatus;
          timezone?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      journeys: {
        Row: {
          id: string;
          user_id: string;
          goal_days: number;
          current_start: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_days?: number;
          current_start?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_days?: number;
          current_start?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reasons: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      relapses: {
        Row: {
          id: string;
          user_id: string;
          timestamp: string;
          trigger: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          timestamp?: string;
          trigger?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          timestamp?: string;
          trigger?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          passage_id: string | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          passage_id?: string | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          passage_id?: string | null;
          completed_at?: string;
        };
        Relationships: [];
      };
      panic_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          outcome: PanicOutcome;
          used_companion: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          outcome: PanicOutcome;
          used_companion?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          outcome?: PanicOutcome;
          used_companion?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      rank_unlocks: {
        Row: {
          id: string;
          user_id: string;
          rank_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rank_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rank_id?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
      ranks: {
        Row: {
          id: string;
          day_threshold: number;
          title: string;
          armor_piece: string | null;
          scripture_ref: string | null;
          description: string;
        };
        Insert: {
          id: string;
          day_threshold: number;
          title: string;
          armor_piece?: string | null;
          scripture_ref?: string | null;
          description: string;
        };
        Update: {
          id?: string;
          day_threshold?: number;
          title?: string;
          armor_piece?: string | null;
          scripture_ref?: string | null;
          description?: string;
        };
        Relationships: [];
      };
      passages: {
        Row: {
          id: string;
          day_number: number;
          verse_ref: string;
          scripture_text: string;
          reflection_text: string;
          prayer_text: string;
          audio_url: string | null;
        };
        Insert: {
          id: string;
          day_number: number;
          verse_ref: string;
          scripture_text: string;
          reflection_text: string;
          prayer_text: string;
          audio_url?: string | null;
        };
        Update: {
          id?: string;
          day_number?: number;
          verse_ref?: string;
          scripture_text?: string;
          reflection_text?: string;
          prayer_text?: string;
          audio_url?: string | null;
        };
        Relationships: [];
      };
      panic_verses: {
        Row: {
          id: string;
          verse_ref: string;
          verse_text: string;
          prayer_text: string;
          audio_url: string | null;
        };
        Insert: {
          id: string;
          verse_ref: string;
          verse_text: string;
          prayer_text: string;
          audio_url?: string | null;
        };
        Update: {
          id?: string;
          verse_ref?: string;
          verse_text?: string;
          prayer_text?: string;
          audio_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_status_type: SubscriptionStatus;
      panic_outcome_type: PanicOutcome;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
