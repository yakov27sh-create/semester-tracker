export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      courses: {
        Row: {
          course_number: string
          default_color: string
          faculty: string | null
          id: string
          name: string
          points: number
          schedule: Json
          semester_id: string
          university: string
        }
        Insert: {
          course_number: string
          default_color: string
          faculty?: string | null
          id?: string
          name: string
          points: number
          schedule?: Json
          semester_id: string
          university: string
        }
        Update: {
          course_number?: string
          default_color?: string
          faculty?: string | null
          id?: string
          name?: string
          points?: number
          schedule?: Json
          semester_id?: string
          university?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          course_progress: Json
          course_selected_sections: Json
          custom_color: string | null
          is_enrolled: boolean
          semester_id: string
          user_id: string
        }
        Insert: {
          course_id: string
          course_progress?: Json
          course_selected_sections?: Json
          custom_color?: string | null
          is_enrolled?: boolean
          semester_id: string
          user_id: string
        }
        Update: {
          course_id?: string
          course_progress?: Json
          course_selected_sections?: Json
          custom_color?: string | null
          is_enrolled?: boolean
          semester_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          end_date: string
          exam_period_a_start: string
          exam_period_b_start: string
          id: string
          name: string
          start_date: string
        }
        Insert: {
          end_date: string
          exam_period_a_start: string
          exam_period_b_start: string
          id: string
          name: string
          start_date: string
        }
        Update: {
          end_date?: string
          exam_period_a_start?: string
          exam_period_b_start?: string
          id?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      user_course_resources: {
        Row: {
          course_id: string
          created_at: string
          id: string
          semester_id: string
          session_type: string
          storage_path: string | null
          time_slots: number[]
          title: string
          url: string | null
          user_id: string
          week_number: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          semester_id: string
          session_type: string
          storage_path?: string | null
          time_slots: number[]
          title: string
          url?: string | null
          user_id: string
          week_number: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          semester_id?: string
          session_type?: string
          storage_path?: string | null
          time_slots?: number[]
          title?: string
          url?: string | null
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_course_resources_user_id_course_id_semester_id_fkey"
            columns: ["user_id", "course_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["user_id", "course_id", "semester_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_course_resource: {
        Args: {
          p_course_id: string
          p_semester_id: string
          p_session_type: string
          p_storage_path: string
          p_timeslots: number[]
          p_title: string
          p_url: string
          p_user_id: string
          p_week_number: number
        }
        Returns: {
          course_id: string
          created_at: string
          id: string
          semester_id: string
          session_type: string
          storage_path: string | null
          time_slots: number[]
          title: string
          url: string | null
          user_id: string
          week_number: number
        }
        SetofOptions: {
          from: "*"
          to: "user_course_resources"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_user_course_resource: {
        Args: { p_resource_id: string; p_user_id: string }
        Returns: undefined
      }
      toggle_course_progress: {
        Args: {
          p_course_id: string
          p_semester_id: string
          p_session_type: string
          p_timeslots: number[]
          p_user_id: string
          p_week_number: number
        }
        Returns: number[]
      }
      update_user_course_resource: {
        Args: {
          p_resource_id: string
          p_storage_path: string
          p_title: string
          p_url: string
          p_user_id: string
        }
        Returns: {
          course_id: string
          created_at: string
          id: string
          semester_id: string
          session_type: string
          storage_path: string | null
          time_slots: number[]
          title: string
          url: string | null
          user_id: string
          week_number: number
        }
        SetofOptions: {
          from: "*"
          to: "user_course_resources"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

