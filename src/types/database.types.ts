/**
 * Supabase PostgreSQL Database Type Definitions
 * Aligned with 3NF Normalized Schema in DATABASE.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          user_id: string;
          role_id: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          user_id?: string;
          role_id?: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
      media: {
        Row: {
          id: string;
          storage_key: string;
          bucket_name: string;
          public_url: string;
          filename: string;
          file_size_bytes: number;
          mime_type: string;
          width: number | null;
          height: number | null;
          blur_hash: string | null;
          alt_text: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          storage_key: string;
          bucket_name: string;
          public_url: string;
          filename: string;
          file_size_bytes: number;
          mime_type: string;
          width?: number | null;
          height?: number | null;
          blur_hash?: string | null;
          alt_text?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          storage_key?: string;
          bucket_name?: string;
          public_url?: string;
          filename?: string;
          file_size_bytes?: number;
          mime_type?: string;
          width?: number | null;
          height?: number | null;
          blur_hash?: string | null;
          alt_text?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          description: string;
          materials_care: string | null;
          status: string;
          is_featured: boolean;
          base_price_cents: number;
          compare_at_price_cents: number | null;
          cost_price_cents: number | null;
          meta_title: string | null;
          meta_description: string | null;
          attributes: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          subtitle?: string | null;
          description: string;
          materials_care?: string | null;
          status?: string;
          is_featured?: boolean;
          base_price_cents: number;
          compare_at_price_cents?: number | null;
          cost_price_cents?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          attributes?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          subtitle?: string | null;
          description?: string;
          materials_care?: string | null;
          status?: string;
          is_featured?: boolean;
          base_price_cents?: number;
          compare_at_price_cents?: number | null;
          cost_price_cents?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          attributes?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          title: string;
          option1_name: string | null;
          option1_value: string | null;
          option2_name: string | null;
          option2_value: string | null;
          price_cents: number;
          compare_at_price_cents: number | null;
          weight_grams: number;
          barcode: string | null;
          is_active: boolean;
          position: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          title: string;
          option1_name?: string | null;
          option1_value?: string | null;
          option2_name?: string | null;
          option2_value?: string | null;
          price_cents: number;
          compare_at_price_cents?: number | null;
          weight_grams?: number;
          barcode?: string | null;
          is_active?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          title?: string;
          option1_name?: string | null;
          option1_value?: string | null;
          option2_name?: string | null;
          option2_value?: string | null;
          price_cents?: number;
          compare_at_price_cents?: number | null;
          weight_grams?: number;
          barcode?: string | null;
          is_active?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      inventory: {
        Row: {
          id: string;
          variant_id: string;
          quantity_available: number;
          quantity_reserved: number;
          low_stock_threshold: number;
          allow_backorder: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          quantity_available?: number;
          quantity_reserved?: number;
          low_stock_threshold?: number;
          allow_backorder?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          quantity_available?: number;
          quantity_reserved?: number;
          low_stock_threshold?: number;
          allow_backorder?: boolean;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
