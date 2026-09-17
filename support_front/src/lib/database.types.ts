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
      demo_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          label: string
          password_plain: string
          role: Database["public"]["Enums"]["roles"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          label: string
          password_plain: string
          role: Database["public"]["Enums"]["roles"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          label?: string
          password_plain?: string
          role?: Database["public"]["Enums"]["roles"]
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_mime_type: Database["public"]["Enums"]["mime_type"] | null
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          content: string | null
          created_at: string
          id: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_mime_type?: Database["public"]["Enums"]["mime_type"] | null
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_mime_type?: Database["public"]["Enums"]["mime_type"] | null
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["roles"]
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["roles"]
          username?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["roles"]
          username?: string
        }
        Relationships: []
      }
      ticket_reads: {
        Row: {
          last_read_at: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_reads_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          agent_id: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          client_id: string
          closed_by: string | null
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
        }
        Insert: {
          agent_id?: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          client_id: string
          closed_by?: string | null
          created_at?: string
          description: string
          id?: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Update: {
          agent_id?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          client_id?: string
          closed_by?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: { Args: { p_user_id: string }; Returns: boolean }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          id: string
          last_sign_in_at: string | null
          role: Database["public"]["Enums"]["roles"]
          username: string
        }[]
      }
      claim_ticket: {
        Args: { p_agent_id: string; p_ticket_id: string }
        Returns: boolean
      }
      close_ticket: { Args: { p_ticket_id: string }; Returns: boolean }
      find_conversation_by_id: {
        Args: { v_ticket_id: string }
        Returns: {
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          description: string
          id: string
          last_message_at: string
          last_message_content: string
          other_user_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          username: string
        }[]
      }
      find_conversation_for_user: {
        Args: { v_last_loaded_ticket_id?: string; v_last_message_at?: string }
        Returns: {
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          description: string
          id: string
          last_message_at: string
          last_message_content: string
          other_user_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          username: string
        }[]
      }
      find_user_ticket: {
        Args: { v_ticket_id: string }
        Returns: {
          agent_id: string | null
          agent_username: string | null
          client_id: string
          client_username: string
          ticket_id: string
        }[]
      }
      get_agent_ticket_stat: {
        Args: { v_agent_id: string }
        Returns: {
          count: number
          status: Database["public"]["Enums"]["ticket_status"]
        }[]
      }
      get_current_user: { Args: never; Returns: string }
      get_role: { Args: never; Returns: string }
      get_unread_counts: {
        Args: never
        Returns: {
          ticket_id: string
          unread_count: number
        }[]
      }
      in_progress_ticket: { Args: { p_ticket_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_agent: { Args: never; Returns: boolean }
      reassign_ticket: {
        Args: { p_new_agent_id: string; p_ticket_id: string }
        Returns: boolean
      }
      send_mail: {
        Args: { p_meta?: Json; p_subject: string; p_targets: string[] }
        Returns: boolean
      }
      update_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["roles"]
          p_profile_id: string
        }
        Returns: boolean
      }
      update_ticket_last_read: {
        Args: { v_ticket_id: string }
        Returns: undefined
      }
    }
    Enums: {
      mime_type: "image/png" | "image/jpeg" | "image/jpg" | "application/pdf"
      roles: "admin" | "client" | "agent"
      ticket_category: "software" | "hardware" | "delivery" | "payment"
      ticket_priority: "low" | "medium" | "high"
      ticket_status: "open" | "in_progress" | "closed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {
      mime_type: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
      roles: ["admin", "client", "agent"],
      ticket_category: ["software", "hardware", "delivery", "payment"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_progress", "closed"],
    },
  },
} as const

