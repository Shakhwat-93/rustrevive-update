/**
 * Supabase PostgreSQL Database Type Definitions
 * Exact mapping to 3NF Normalized Schema in supabase/migrations/
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
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";
export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "COD_PENDING"
  | "COD_COLLECTED";
export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "RETURNED"
  | "CANCELLED";
export type DeliveryStatus =
  | "CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "CANCELLED"
  | "RETURNED";
export type ReturnStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_SCHEDULED"
  | "RECEIVED"
  | "COMPLETED";
export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";

export interface Database {
  public: {
    Tables: {
      courier_providers: {
        Row: {
          id: string;
          name: string;
          code: string;
          is_active: boolean;
          is_default: boolean;
          configuration: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          is_active?: boolean;
          is_default?: boolean;
          configuration?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          is_active?: boolean;
          is_default?: boolean;
          configuration?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fulfillments: {
        Row: {
          id: string;
          order_id: string;
          courier_provider_id: string | null;
          status: DeliveryStatus;
          tracking_number: string | null;
          shipping_label_url: string | null;
          shipment_reference: string | null;
          pickup_reference: string | null;
          courier_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          courier_provider_id?: string | null;
          status?: DeliveryStatus;
          tracking_number?: string | null;
          shipping_label_url?: string | null;
          shipment_reference?: string | null;
          pickup_reference?: string | null;
          courier_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          courier_provider_id?: string | null;
          status?: DeliveryStatus;
          tracking_number?: string | null;
          shipping_label_url?: string | null;
          shipment_reference?: string | null;
          pickup_reference?: string | null;
          courier_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fulfillments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fulfillments_courier_provider_id_fkey";
            columns: ["courier_provider_id"];
            isOneToOne: false;
            referencedRelation: "courier_providers";
            referencedColumns: ["id"];
          }
        ];
      };
      return_requests: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string | null;
          reason: string;
          status: ReturnStatus;
          items: Json;
          admin_notes: string | null;
          requested_at: string;
          approved_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_id?: string | null;
          reason: string;
          status?: ReturnStatus;
          items?: Json;
          admin_notes?: string | null;
          requested_at?: string;
          approved_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          customer_id?: string | null;
          reason?: string;
          status?: ReturnStatus;
          items?: Json;
          admin_notes?: string | null;
          requested_at?: string;
          approved_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_requests_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          channel: NotificationChannel;
          type: string;
          title: string;
          message: string;
          resource_type: string | null;
          resource_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          channel?: NotificationChannel;
          type: string;
          title: string;
          message: string;
          resource_type?: string | null;
          resource_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          channel?: NotificationChannel;
          type?: string;
          title?: string;
          message?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
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
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
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
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          name: string;
          phone: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          name: string;
          phone: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          name?: string;
          phone?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          id: string;
          customer_id: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          area: string | null;
          postal_code: string | null;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          area?: string | null;
          postal_code?: string | null;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          full_name?: string;
          phone?: string;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          area?: string | null;
          postal_code?: string | null;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      shipping_methods: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          estimated_days: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          estimated_days: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          estimated_days?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          fulfillment_status: FulfillmentStatus;
          payment_method: string;
          currency: string;
          subtotal: number;
          discount_total: number;
          shipping_total: number;
          tax_total: number;
          grand_total: number;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          shipping_address_snapshot: Json;
          billing_address_snapshot: Json | null;
          notes: string | null;
          customer_notes: string | null;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          fulfillment_status?: FulfillmentStatus;
          payment_method?: string;
          currency?: string;
          subtotal: number;
          discount_total?: number;
          shipping_total?: number;
          tax_total?: number;
          grand_total: number;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          shipping_address_snapshot: Json;
          billing_address_snapshot?: Json | null;
          notes?: string | null;
          customer_notes?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          fulfillment_status?: FulfillmentStatus;
          payment_method?: string;
          currency?: string;
          subtotal?: number;
          discount_total?: number;
          shipping_total?: number;
          tax_total?: number;
          grand_total?: number;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          shipping_address_snapshot?: Json;
          billing_address_snapshot?: Json | null;
          notes?: string | null;
          customer_notes?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_title_snapshot: string;
          variant_title_snapshot: string | null;
          sku_snapshot: string;
          image_url_snapshot: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_title_snapshot: string;
          variant_title_snapshot?: string | null;
          sku_snapshot: string;
          image_url_snapshot?: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_title_snapshot?: string;
          variant_title_snapshot?: string | null;
          sku_snapshot?: string;
          image_url_snapshot?: string | null;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          event_type: string;
          old_status: string | null;
          new_status: string | null;
          message: string;
          created_by: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          event_type: string;
          old_status?: string | null;
          new_status?: string | null;
          message: string;
          created_by?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          event_type?: string;
          old_status?: string | null;
          new_status?: string | null;
          message?: string;
          created_by?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
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
      generate_order_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      product_status: ProductStatus;
      inventory_movement_type: InventoryMovementType;
      cms_status: CMSStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      fulfillment_status: FulfillmentStatus;
      delivery_status: DeliveryStatus;
      return_status: ReturnStatus;
      notification_channel: NotificationChannel;
    };
  };
}
