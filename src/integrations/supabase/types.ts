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
      achievements: {
        Row: {
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          is_paid: boolean
          is_recurring: boolean
          paid_at: string | null
          recurring_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          is_paid?: boolean
          is_recurring?: boolean
          paid_at?: string | null
          recurring_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          is_recurring?: boolean
          paid_at?: string | null
          recurring_end_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          month: number
          monthly_limit: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          month: number
          monthly_limit: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          month?: number
          monthly_limit?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string
          credit_limit: number
          due_day: number
          id: string
          is_active: boolean
          last_four: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          is_active?: boolean
          last_four?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          is_active?: boolean
          last_four?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dreams: {
        Row: {
          created_at: string
          current_amount: number
          description: string | null
          id: string
          image_url: string | null
          priority: string
          status: string
          target_amount: number | null
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          image_url?: string | null
          priority?: string
          status?: string
          target_amount?: number | null
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          image_url?: string | null
          priority?: string
          status?: string
          target_amount?: number | null
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          is_completed: boolean
          medal: string | null
          name: string
          target_value: number
          user_id: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          is_completed?: boolean
          medal?: string | null
          name: string
          target_value: number
          user_id: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          is_completed?: boolean
          medal?: string | null
          name?: string
          target_value?: number
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string
          current_value: number | null
          deadline: string | null
          description: string | null
          goal_type: string
          id: string
          is_main: boolean
          name: string
          priority: string
          status: string
          target_value: number | null
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          is_main?: boolean
          name: string
          priority?: string
          status?: string
          target_value?: number | null
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          is_main?: boolean
          name?: string
          priority?: string
          status?: string
          target_value?: number | null
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed_at: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          attribute: string | null
          best_streak: number
          created_at: string
          custom_days: string[] | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          streak: number
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          attribute?: string | null
          best_streak?: number
          created_at?: string
          custom_days?: string[] | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name: string
          streak?: number
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          attribute?: string | null
          best_streak?: number
          created_at?: string
          custom_days?: string[] | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          streak?: number
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      investment_transactions: {
        Row: {
          created_at: string
          id: string
          investment_id: string | null
          notes: string | null
          price: number
          quantity: number
          total: number
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          investment_id?: string | null
          notes?: string | null
          price?: number
          quantity?: number
          total?: number
          transaction_date?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          investment_id?: string | null
          notes?: string | null
          price?: number
          quantity?: number
          total?: number
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          asset_type: string
          average_price: number
          created_at: string
          current_price: number
          dividends_total: number
          id: string
          name: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          average_price?: number
          created_at?: string
          current_price?: number
          dividends_total?: number
          id?: string
          name: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          average_price?: number
          created_at?: string
          current_price?: number
          dividends_total?: number
          id?: string
          name?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          level: number
          monthly_savings_goal: number | null
          plan: string
          preferred_currency: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          level?: number
          monthly_savings_goal?: number | null
          plan?: string
          preferred_currency?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          level?: number
          monthly_savings_goal?: number | null
          plan?: string
          preferred_currency?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          parent_task_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account: string | null
          amount: number
          category: string
          created_at: string
          credit_card_id: string | null
          description: string | null
          due_date: string | null
          id: string
          installment_count: number | null
          installment_number: number | null
          is_recurring: boolean
          payment_method: string | null
          payment_status: string
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          category: string
          created_at?: string
          credit_card_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          installment_count?: number | null
          installment_number?: number | null
          is_recurring?: boolean
          payment_method?: string | null
          payment_status?: string
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          category?: string
          created_at?: string
          credit_card_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          installment_count?: number | null
          installment_number?: number | null
          is_recurring?: boolean
          payment_method?: string | null
          payment_status?: string
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
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
