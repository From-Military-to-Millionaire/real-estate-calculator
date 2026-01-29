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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_analyses: {
        Row: {
          annual_insurance: number | null
          annual_property_taxes: number | null
          arv: number | null
          closing_costs: number | null
          created_at: string
          down_payment_amount: number | null
          down_payment_percent: number | null
          flip_agent_commission_percent: number | null
          flip_monthly_holding_costs: number | null
          flip_rehab_timeline_months: number | null
          flip_selling_closing_costs_percent: number | null
          flip_target_sale_price: number | null
          id: string
          interest_rate: number
          is_public: boolean | null
          loan_term_years: number | null
          ltr_additional_cash_invested: number | null
          ltr_appreciation_rate: number | null
          ltr_maintenance_reserve_percent: number | null
          ltr_monthly_rent: number | null
          ltr_other_monthly_expenses: number | null
          ltr_property_management_percent: number | null
          ltr_vacancy_rate: number | null
          monthly_utilities: number | null
          name: string | null
          notes: string | null
          property_address: string
          purchase_price: number
          refinance_ltv: number | null
          refinance_points: number | null
          rehab_cabinets: number | null
          rehab_costs: number | null
          rehab_debt: number | null
          rehab_electrical: number | null
          rehab_floors: number | null
          rehab_foundation: number | null
          rehab_framing: number | null
          rehab_landscaping: number | null
          rehab_misc: number | null
          rehab_paint: number | null
          rehab_plumbing: number | null
          rehab_roof: number | null
          rehab_user_cash: number | null
          rent_appreciation_rate: number | null
          share_id: string | null
          short_term_interest_rate: number | null
          short_term_loan_amount: number | null
          short_term_loan_term_months: number | null
          short_term_months_held: number | null
          short_term_points: number | null
          str_average_nightly_rate: number | null
          str_average_stay_length: number | null
          str_cleaning_fee: number | null
          str_furnishing_costs: number | null
          str_high_season_rate_multiplier: number | null
          str_low_season_rate_multiplier: number | null
          str_management_fee_percent: number | null
          str_monthly_operating_expenses: number | null
          str_occupancy_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_insurance?: number | null
          annual_property_taxes?: number | null
          arv?: number | null
          closing_costs?: number | null
          created_at?: string
          down_payment_amount?: number | null
          down_payment_percent?: number | null
          flip_agent_commission_percent?: number | null
          flip_monthly_holding_costs?: number | null
          flip_rehab_timeline_months?: number | null
          flip_selling_closing_costs_percent?: number | null
          flip_target_sale_price?: number | null
          id?: string
          interest_rate: number
          is_public?: boolean | null
          loan_term_years?: number | null
          ltr_additional_cash_invested?: number | null
          ltr_appreciation_rate?: number | null
          ltr_maintenance_reserve_percent?: number | null
          ltr_monthly_rent?: number | null
          ltr_other_monthly_expenses?: number | null
          ltr_property_management_percent?: number | null
          ltr_vacancy_rate?: number | null
          monthly_utilities?: number | null
          name?: string | null
          notes?: string | null
          property_address: string
          purchase_price: number
          refinance_ltv?: number | null
          refinance_points?: number | null
          rehab_cabinets?: number | null
          rehab_costs?: number | null
          rehab_debt?: number | null
          rehab_electrical?: number | null
          rehab_floors?: number | null
          rehab_foundation?: number | null
          rehab_framing?: number | null
          rehab_landscaping?: number | null
          rehab_misc?: number | null
          rehab_paint?: number | null
          rehab_plumbing?: number | null
          rehab_roof?: number | null
          rehab_user_cash?: number | null
          rent_appreciation_rate?: number | null
          share_id?: string | null
          short_term_interest_rate?: number | null
          short_term_loan_amount?: number | null
          short_term_loan_term_months?: number | null
          short_term_months_held?: number | null
          short_term_points?: number | null
          str_average_nightly_rate?: number | null
          str_average_stay_length?: number | null
          str_cleaning_fee?: number | null
          str_furnishing_costs?: number | null
          str_high_season_rate_multiplier?: number | null
          str_low_season_rate_multiplier?: number | null
          str_management_fee_percent?: number | null
          str_monthly_operating_expenses?: number | null
          str_occupancy_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_insurance?: number | null
          annual_property_taxes?: number | null
          arv?: number | null
          closing_costs?: number | null
          created_at?: string
          down_payment_amount?: number | null
          down_payment_percent?: number | null
          flip_agent_commission_percent?: number | null
          flip_monthly_holding_costs?: number | null
          flip_rehab_timeline_months?: number | null
          flip_selling_closing_costs_percent?: number | null
          flip_target_sale_price?: number | null
          id?: string
          interest_rate?: number
          is_public?: boolean | null
          loan_term_years?: number | null
          ltr_additional_cash_invested?: number | null
          ltr_appreciation_rate?: number | null
          ltr_maintenance_reserve_percent?: number | null
          ltr_monthly_rent?: number | null
          ltr_other_monthly_expenses?: number | null
          ltr_property_management_percent?: number | null
          ltr_vacancy_rate?: number | null
          monthly_utilities?: number | null
          name?: string | null
          notes?: string | null
          property_address?: string
          purchase_price?: number
          refinance_ltv?: number | null
          refinance_points?: number | null
          rehab_cabinets?: number | null
          rehab_costs?: number | null
          rehab_debt?: number | null
          rehab_electrical?: number | null
          rehab_floors?: number | null
          rehab_foundation?: number | null
          rehab_framing?: number | null
          rehab_landscaping?: number | null
          rehab_misc?: number | null
          rehab_paint?: number | null
          rehab_plumbing?: number | null
          rehab_roof?: number | null
          rehab_user_cash?: number | null
          rent_appreciation_rate?: number | null
          share_id?: string | null
          short_term_interest_rate?: number | null
          short_term_loan_amount?: number | null
          short_term_loan_term_months?: number | null
          short_term_months_held?: number | null
          short_term_points?: number | null
          str_average_nightly_rate?: number | null
          str_average_stay_length?: number | null
          str_cleaning_fee?: number | null
          str_furnishing_costs?: number | null
          str_high_season_rate_multiplier?: number | null
          str_low_season_rate_multiplier?: number | null
          str_management_fee_percent?: number | null
          str_monthly_operating_expenses?: number | null
          str_occupancy_rate?: number | null
          updated_at?: string
          user_id?: string
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
