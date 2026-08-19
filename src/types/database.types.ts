/**
 * Supabase PostgreSQL Database Type Definitions
 * Exact mapping to 3NF Normalized Schema in supabase/migrations/20260819_001_commerce_core_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type InventoryMovementType =
  | "RESTOCK"
  | "SALE"
  | "RETURN"
  | "CANCELLATION"
  | "MANUAL_ADJUSTMENT"
  | "DAMAGE";
export type CMSStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_products: {
        Row: {
          collection_id: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          collection_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          collection_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          status: ProductStatus;
          product_type: string;
          brand: string;
          category_id: string | null;
          base_price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          sku: string;
          barcode: string | null;
          has_variants: boolean;
          is_featured: boolean;
          is_active: boolean;
          sort_order: number;
          tags: string[] | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          short_description?: string | null;
          status?: ProductStatus;
          product_type?: string;
          brand?: string;
          category_id?: string | null;
          base_price: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          sku: string;
          barcode?: string | null;
          has_variants?: boolean;
          is_featured?: boolean;
          is_active?: boolean;
          sort_order?: number;
          tags?: string[] | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          short_description?: string | null;
          status?: ProductStatus;
          product_type?: string;
          brand?: string;
          category_id?: string | null;
          base_price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          sku?: string;
          barcode?: string | null;
          has_variants?: boolean;
          is_featured?: boolean;
          is_active?: boolean;
          sort_order?: number;
          tags?: string[] | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          title: string;
          sku: string;
          barcode: string | null;
          price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          option_1_name: string | null;
          option_1_value: string | null;
          option_2_name: string | null;
          option_2_value: string | null;
          option_3_name: string | null;
          option_3_value: string | null;
          weight: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          title: string;
          sku: string;
          barcode?: string | null;
          price: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          option_1_name?: string | null;
          option_1_value?: string | null;
          option_2_name?: string | null;
          option_2_value?: string | null;
          option_3_name?: string | null;
          option_3_value?: string | null;
          weight?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          title?: string;
          sku?: string;
          barcode?: string | null;
          price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          option_1_name?: string | null;
          option_1_value?: string | null;
          option_2_name?: string | null;
          option_2_value?: string | null;
          option_3_name?: string | null;
          option_3_value?: string | null;
          weight?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          storage_provider: string;
          bucket: string;
          object_key: string;
          public_url: string;
          original_filename: string;
          mime_type: string;
          file_size: number;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          storage_provider?: string;
          bucket?: string;
          object_key: string;
          public_url: string;
          original_filename: string;
          mime_type: string;
          file_size?: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          storage_provider?: string;
          bucket?: string;
          object_key?: string;
          public_url?: string;
          original_filename?: string;
          mime_type?: string;
          file_size?: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_media: {
        Row: {
          id: string;
          product_id: string;
          media_id: string;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          media_id: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          media_id?: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          reserved_quantity: number;
          low_stock_threshold: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          quantity?: number;
          reserved_quantity?: number;
          low_stock_threshold?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          reserved_quantity?: number;
          low_stock_threshold?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          inventory_id: string;
          variant_id: string | null;
          movement_type: InventoryMovementType;
          quantity_change: number;
          reference_type: string | null;
          reference_id: string | null;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_id: string;
          variant_id?: string | null;
          movement_type: InventoryMovementType;
          quantity_change: number;
          reference_type?: string | null;
          reference_id?: string | null;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_id?: string;
          variant_id?: string | null;
          movement_type?: InventoryMovementType;
          quantity_change?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      homepage_cms: {
        Row: {
          id: string;
          version: number;
          status: CMSStatus;
          config: Json;
          last_published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version?: number;
          status?: CMSStatus;
          config: Json;
          last_published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version?: number;
          status?: CMSStatus;
          config?: Json;
          last_published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          actor_name: string;
          action: string;
          resource: string;
          resource_id: string;
          changes: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          actor_name: string;
          action: string;
          resource: string;
          resource_id: string;
          changes?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          actor_name?: string;
          action?: string;
          resource?: string;
          resource_id?: string;
          changes?: Json | null;
          ip_address?: string | null;
          created_at?: string;
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
      product_status: ProductStatus;
      inventory_movement_type: InventoryMovementType;
      cms_status: CMSStatus;
    };
  };
}
