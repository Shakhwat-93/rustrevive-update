export interface PublicTrackingConfig {
  gtmEnabled: boolean;
  gtmContainerId: string | null;
  ga4Enabled: boolean;
  ga4MeasurementId: string | null;
  metaPixelEnabled: boolean;
  metaPixelId: string | null;
  metaCapiEnabled: boolean;
  metaTestEventCode: string | null;
  tiktokPixelEnabled: boolean;
  tiktokPixelId: string | null;
  tiktokEventsApiEnabled: boolean;
  tiktokTestEventCode: string | null;
  ecommerceTrackingEnabled: boolean;
  debugTrackingEnabled: boolean;
  consentModeEnabled: boolean;
}

export interface AdminMarketingSettingsInput {
  gtmEnabled?: boolean;
  gtmContainerId?: string | null;
  ga4Enabled?: boolean;
  ga4MeasurementId?: string | null;
  metaPixelEnabled?: boolean;
  metaPixelId?: string | null;
  metaCapiEnabled?: boolean;
  metaCapiAccessToken?: string | null;
  metaTestEventCode?: string | null;
  tiktokPixelEnabled?: boolean;
  tiktokPixelId?: string | null;
  tiktokEventsApiEnabled?: boolean;
  tiktokEventsApiAccessToken?: string | null;
  tiktokTestEventCode?: string | null;
  ecommerceTrackingEnabled?: boolean;
  debugTrackingEnabled?: boolean;
  consentModeEnabled?: boolean;
}

export interface ServerConversionEvent {
  eventId: string;
  eventName:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "Purchase"
    | "Delivered"
    | "CancelledAfterDelivery";
  orderId?: string;
  orderNumber?: string;
  currency?: string;
  value?: number;
  customer?: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    city?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  items?: Array<{
    productId: string;
    variantId?: string | null;
    title: string;
    sku?: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  sourceUrl?: string;
}
