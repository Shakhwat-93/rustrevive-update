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
  | "INITIATED"
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
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
export type CampaignStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type CampaignType = "PROMOTION" | "PRODUCT_CAMPAIGN" | "COLLECTION_CAMPAIGN" | "EMAIL" | "WHATSAPP" | "SMS";
export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "PRODUCT_VIEW"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "BEGIN_CHECKOUT"
  | "PURCHASE"
  | "WISHLIST_ADD"
  | "SEARCH";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          provider_transaction_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          payment_method: string;
          gateway_response_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider: string;
          provider_transaction_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          payment_method?: string;
          gateway_response_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: string;
          provider_transaction_id?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          payment_method?: string;
          gateway_response_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      refunds: {
        Row: {
          id: string;
          payment_transaction_id: string;
          order_id: string;
          amount: number;
          reason: string;
          status: string;
          provider_refund_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_transaction_id: string;
          order_id: string;
          amount: number;
          reason: string;
          status?: string;
          provider_refund_id?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_transaction_id?: string;
          order_id?: string;
          amount?: number;
          reason?: string;
          status?: string;
          provider_refund_id?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refunds_payment_transaction_id_fkey";
            columns: ["payment_transaction_id"];
            isOneToOne: false;
            referencedRelation: "payment_transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "refunds_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: DiscountType;
          value: number;
          minimum_order_amount: number;
          maximum_discount_amount: number | null;
          usage_limit: number | null;
          usage_count: number;
          per_customer_limit: number;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type: DiscountType;
          value: number;
          minimum_order_amount?: number;
          maximum_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          per_customer_limit?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: DiscountType;
          value?: number;
          minimum_order_amount?: number;
          maximum_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          per_customer_limit?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discount_usages: {
        Row: {
          id: string;
          discount_id: string;
          customer_id: string | null;
          order_id: string;
          discount_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          discount_id: string;
          customer_id?: string | null;
          order_id: string;
          discount_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          discount_id?: string;
          customer_id?: string | null;
          order_id?: string;
          discount_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_usages_discount_id_fkey";
            columns: ["discount_id"];
            isOneToOne: false;
            referencedRelation: "discounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discount_usages_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      wishlist_items: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          customer_id: string | null;
          customer_name: string;
          order_id: string | null;
          rating: number;
          title: string | null;
          content: string;
          status: ReviewStatus;
          is_verified_purchase: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          customer_id?: string | null;
          customer_name: string;
          order_id?: string | null;
          rating: number;
          title?: string | null;
          content: string;
          status?: ReviewStatus;
          is_verified_purchase?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          customer_id?: string | null;
          customer_name?: string;
          order_id?: string | null;
          rating?: number;
          title?: string | null;
          content?: string;
          status?: ReviewStatus;
          is_verified_purchase?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      customer_segments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          rules: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          rules?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          rules?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      marketing_campaigns: {
        Row: {
          id: string;
          name: string;
          type: CampaignType;
          status: CampaignStatus;
          target_type: string;
          target_id: string | null;
          starts_at: string | null;
          ends_at: string | null;
          budget: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: CampaignType;
          status?: CampaignStatus;
          target_type?: string;
          target_id?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          budget?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: CampaignType;
          status?: CampaignStatus;
          target_type?: string;
          target_id?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          budget?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: AnalyticsEventType;
          session_id: string | null;
          user_id: string | null;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: AnalyticsEventType;
          session_id?: string | null;
          user_id?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: AnalyticsEventType;
          session_id?: string | null;
          user_id?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      marketing_tracking_settings: {
        Row: {
          id: string;
          gtm_enabled: boolean;
          gtm_container_id: string | null;
          ga4_enabled: boolean;
          ga4_measurement_id: string | null;
          meta_pixel_enabled: boolean;
          meta_pixel_id: string | null;
          meta_capi_enabled: boolean;
          meta_capi_access_token: string | null;
          meta_test_event_code: string | null;
          tiktok_pixel_enabled: boolean;
          tiktok_pixel_id: string | null;
          tiktok_events_api_enabled: boolean;
          tiktok_events_api_access_token: string | null;
          tiktok_test_event_code: string | null;
          ecommerce_tracking_enabled: boolean;
          debug_tracking_enabled: boolean;
          consent_mode_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gtm_enabled?: boolean;
          gtm_container_id?: string | null;
          ga4_enabled?: boolean;
          ga4_measurement_id?: string | null;
          meta_pixel_enabled?: boolean;
          meta_pixel_id?: string | null;
          meta_capi_enabled?: boolean;
          meta_capi_access_token?: string | null;
          meta_test_event_code?: string | null;
          tiktok_pixel_enabled?: boolean;
          tiktok_pixel_id?: string | null;
          tiktok_events_api_enabled?: boolean;
          tiktok_events_api_access_token?: string | null;
          tiktok_test_event_code?: string | null;
          ecommerce_tracking_enabled?: boolean;
          debug_tracking_enabled?: boolean;
          consent_mode_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gtm_enabled?: boolean;
          gtm_container_id?: string | null;
          ga4_enabled?: boolean;
          ga4_measurement_id?: string | null;
          meta_pixel_enabled?: boolean;
          meta_pixel_id?: string | null;
          meta_capi_enabled?: boolean;
          meta_capi_access_token?: string | null;
          meta_test_event_code?: string | null;
          tiktok_pixel_enabled?: boolean;
          tiktok_pixel_id?: string | null;
          tiktok_events_api_enabled?: boolean;
          tiktok_events_api_access_token?: string | null;
          tiktok_test_event_code?: string | null;
          ecommerce_tracking_enabled?: boolean;
          debug_tracking_enabled?: boolean;
          consent_mode_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      server_analytics_logs: {
        Row: {
          id: string;
          event_id: string;
          event_name: string;
          order_id: string | null;
          provider: string;
          status: string;
          attempt_count: number;
          payload: Json | null;
          response_data: Json | null;
          error_message: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          event_name: string;
          order_id?: string | null;
          provider: string;
          status?: string;
          attempt_count?: number;
          payload?: Json | null;
          response_data?: Json | null;
          error_message?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          event_name?: string;
          order_id?: string | null;
          provider?: string;
          status?: string;
          attempt_count?: number;
          payload?: Json | null;
          response_data?: Json | null;
          error_message?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "server_analytics_logs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
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
      admin_push_subscriptions: {
        Row: {
          id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          admin_id: string | null;
          user_agent: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          admin_id?: string | null;
          user_agent?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          admin_id?: string | null;
          user_agent?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incomplete_checkouts: {
        Row: {
          id: string;
          checkout_session_id: string;
          cart_session_id: string;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          shipping_address: string | null;
          city: string | null;
          area: string | null;
          postal_code: string | null;
          cart_snapshot: Record<string, any>[] | any;
          item_count: number;
          subtotal: number;
          discount_total: number;
          shipping_total: number;
          estimated_total: number;
          shipping_method_id: string | null;
          coupon_code: string | null;
          customer_notes: string | null;
          status: "IN_PROGRESS" | "ABANDONED" | "CONVERTED" | "EXPIRED";
          last_activity_at: string;
          created_at: string;
          updated_at: string;
          converted_order_id: string | null;
        };
        Insert: {
          id?: string;
          checkout_session_id: string;
          cart_session_id: string;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: string | null;
          city?: string | null;
          area?: string | null;
          postal_code?: string | null;
          cart_snapshot?: Record<string, any>[] | any;
          item_count?: number;
          subtotal?: number;
          discount_total?: number;
          shipping_total?: number;
          estimated_total?: number;
          shipping_method_id?: string | null;
          coupon_code?: string | null;
          customer_notes?: string | null;
          status?: "IN_PROGRESS" | "ABANDONED" | "CONVERTED" | "EXPIRED";
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
          converted_order_id?: string | null;
        };
        Update: {
          id?: string;
          checkout_session_id?: string;
          cart_session_id?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: string | null;
          city?: string | null;
          area?: string | null;
          postal_code?: string | null;
          cart_snapshot?: Record<string, any>[] | any;
          item_count?: number;
          subtotal?: number;
          discount_total?: number;
          shipping_total?: number;
          estimated_total?: number;
          shipping_method_id?: string | null;
          coupon_code?: string | null;
          customer_notes?: string | null;
          status?: "IN_PROGRESS" | "ABANDONED" | "CONVERTED" | "EXPIRED";
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
          converted_order_id?: string | null;
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
      discount_type: DiscountType;
      review_status: ReviewStatus;
      campaign_status: CampaignStatus;
      campaign_type: CampaignType;
      analytics_event_type: AnalyticsEventType;
    };
  };
}
