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
      api_keys: {
        Row: {
          id: string
          user_id: string
          sequencer: string
          api_key: string
          workspace_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sequencer: string
          api_key: string
          workspace_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sequencer?: string
          api_key?: string
          workspace_id?: string | null
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          sequencer: string
          user_id: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          sequencer: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sequencer?: string
          user_id?: string
          created_at?: string
        }
      }
      campaign_stats: {
        Row: {
          id: string
          campaign_id: string
          prospects_emailed: number
          replies: number
          positive_replies: number
          reply_rate: number
          positive_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          prospects_emailed: number
          replies: number
          positive_replies: number
          reply_rate: number
          positive_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          prospects_emailed?: number
          replies?: number
          positive_replies?: number
          reply_rate?: number
          positive_rate?: number
          created_at?: string
        }
      }
      shared_campaigns: {
        Row: {
          id: string
          campaign_id: string
          share_token: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          share_token: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          share_token?: string
          created_at?: string
        }
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
  }
} 