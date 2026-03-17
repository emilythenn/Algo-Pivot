export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          severity: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          severity?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          severity?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      evidence_reports: {
        Row: {
          ai_analysis: string | null
          created_at: string | null
          gps_data: Json | null
          id: string
          pdf_url: string | null
          report_title: string
          report_type: string | null
          scan_id: string | null
          status: string | null
          user_id: string
          weather_data: Json | null
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string | null
          gps_data?: Json | null
          id?: string
          pdf_url?: string | null
          report_title: string
          report_type?: string | null
          scan_id?: string | null
          status?: string | null
          user_id: string
          weather_data?: Json | null
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string | null
          gps_data?: Json | null
          id?: string
          pdf_url?: string | null
          report_title?: string
          report_type?: string | null
          scan_id?: string | null
          status?: string | null
          user_id?: string
          weather_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_reports_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          acreage: number | null
          avatar_url: string | null
          created_at: string | null
          district: string | null
          email: string | null
          farm_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          primary_crop: string | null
          role: string | null
          secondary_crops: string | null
          soil_type: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          acreage?: number | null
          avatar_url?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          primary_crop?: string | null
          role?: string | null
          secondary_crops?: string | null
          soil_type?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          acreage?: number | null
          avatar_url?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          primary_crop?: string | null
          role?: string | null
          secondary_crops?: string | null
          soil_type?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scan_results: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          crop_name: string
          germination_rate: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          image_url: string | null
          scan_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          crop_name: string
          germination_rate?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          image_url?: string | null
          scan_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          crop_name?: string
          germination_rate?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          image_url?: string | null
          scan_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          analytics_opt_in: boolean | null
          created_at: string | null
          crop_advisory: boolean | null
          currency: string | null
          data_export: boolean | null
          date_format: string | null
          email_digest: boolean | null
          id: string
          market_updates: boolean | null
          public_profile: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          seed_scan_results: boolean | null
          share_location: boolean | null
          sms_alerts: boolean | null
          sound_effects: boolean | null
          temp_unit: string | null
          timezone: string | null
          two_factor: boolean | null
          updated_at: string | null
          user_id: string
          weather_alerts: boolean | null
        }
        Insert: {
          analytics_opt_in?: boolean | null
          created_at?: string | null
          crop_advisory?: boolean | null
          currency?: string | null
          data_export?: boolean | null
          date_format?: string | null
          email_digest?: boolean | null
          id?: string
          market_updates?: boolean | null
          public_profile?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          seed_scan_results?: boolean | null
          share_location?: boolean | null
          sms_alerts?: boolean | null
          sound_effects?: boolean | null
          temp_unit?: string | null
          timezone?: string | null
          two_factor?: boolean | null
          updated_at?: string | null
          user_id: string
          weather_alerts?: boolean | null
        }
        Update: {
          analytics_opt_in?: boolean | null
          created_at?: string | null
          crop_advisory?: boolean | null
          currency?: string | null
          data_export?: boolean | null
          date_format?: string | null
          email_digest?: boolean | null
          id?: string
          market_updates?: boolean | null
          public_profile?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          seed_scan_results?: boolean | null
          share_location?: boolean | null
          sms_alerts?: boolean | null
          sound_effects?: boolean | null
          temp_unit?: string | null
          timezone?: string | null
          two_factor?: boolean | null
          updated_at?: string | null
          user_id?: string
          weather_alerts?: boolean | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
