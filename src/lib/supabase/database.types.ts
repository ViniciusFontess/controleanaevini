export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          category: string
          closing_day: number | null
          color: string | null
          created_at: string
          due_day: number | null
          id: string
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          balance?: number
          category: string
          closing_day?: number | null
          color?: string | null
          created_at?: string
          due_day?: number | null
          id?: string
          kind: string
          name: string
          user_id: string
        }
        Update: {
          balance?: number
          category?: string
          closing_day?: number | null
          color?: string | null
          created_at?: string
          due_day?: number | null
          id?: string
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          id: string
          name: string
          target_amount: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          target_amount: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          target_amount?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recurrences: {
        Row: {
          account_id: string | null
          active: boolean
          amount: number
          category: string
          created_at: string
          day_of_month: number
          end_date: string | null
          id: string
          name: string
          start_date: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          amount: number
          category: string
          created_at?: string
          day_of_month: number
          end_date?: string | null
          id?: string
          name: string
          start_date?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          day_of_month?: number
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrences_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          created_at: string
          id: string
          month_date: string
          net_worth: number
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_date: string
          net_worth: number
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_date?: string
          net_worth?: number
          total_assets?: number
          total_liabilities?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          cash_date: string
          category: string
          created_at: string
          description: string
          id: string
          installment_group: string | null
          installment_number: number | null
          installment_total: number | null
          occurred_on: string
          recurrence_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          cash_date: string
          category: string
          created_at?: string
          description: string
          id?: string
          installment_group?: string | null
          installment_number?: number | null
          installment_total?: number | null
          occurred_on?: string
          recurrence_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          cash_date?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          installment_group?: string | null
          installment_number?: number | null
          installment_total?: number | null
          occurred_on?: string
          recurrence_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "recurrences"
            referencedColumns: ["id"]
          },
        ]
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
