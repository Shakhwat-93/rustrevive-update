import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

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
  eventName: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
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

export class MarketingTrackingService {
  private static SINGLETON_ID = "marketing_tracking_singleton";

  /**
   * Fetch Public (Client-Safe) Tracking Configuration
   * NEVER exposes server access tokens.
   */
  public static async getPublicConfig(): Promise<PublicTrackingConfig> {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("marketing_tracking_settings")
      .select(`
        gtm_enabled,
        gtm_container_id,
        ga4_enabled,
        ga4_measurement_id,
        meta_pixel_enabled,
        meta_pixel_id,
        meta_capi_enabled,
        meta_test_event_code,
        tiktok_pixel_enabled,
        tiktok_pixel_id,
        tiktok_events_api_enabled,
        tiktok_test_event_code,
        ecommerce_tracking_enabled,
        debug_tracking_enabled,
        consent_mode_enabled
      `)
      .eq("id", this.SINGLETON_ID)
      .maybeSingle();

    return {
      gtmEnabled: data?.gtm_enabled ?? false,
      gtmContainerId: data?.gtm_container_id ?? null,
      ga4Enabled: data?.ga4_enabled ?? false,
      ga4MeasurementId: data?.ga4_measurement_id ?? null,
      metaPixelEnabled: data?.meta_pixel_enabled ?? false,
      metaPixelId: data?.meta_pixel_id ?? null,
      metaCapiEnabled: data?.meta_capi_enabled ?? false,
      metaTestEventCode: data?.meta_test_event_code ?? null,
      tiktokPixelEnabled: data?.tiktok_pixel_enabled ?? false,
      tiktokPixelId: data?.tiktok_pixel_id ?? null,
      tiktokEventsApiEnabled: data?.tiktok_events_api_enabled ?? false,
      tiktokTestEventCode: data?.tiktok_test_event_code ?? null,
      ecommerceTrackingEnabled: data?.ecommerce_tracking_enabled ?? true,
      debugTrackingEnabled: data?.debug_tracking_enabled ?? false,
      consentModeEnabled: data?.consent_mode_enabled ?? false,
    };
  }

  /**
   * Fetch Full Admin Settings (Masking secret tokens)
   */
  public static async getAdminSettings() {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("marketing_tracking_settings")
      .select("*")
      .eq("id", this.SINGLETON_ID)
      .maybeSingle();

    if (!data) {
      return {
        id: this.SINGLETON_ID,
        gtm_enabled: false,
        gtm_container_id: "",
        ga4_enabled: false,
        ga4_measurement_id: "",
        meta_pixel_enabled: false,
        meta_pixel_id: "",
        meta_capi_enabled: false,
        meta_capi_access_token_masked: "",
        has_meta_capi_token: false,
        meta_test_event_code: "",
        tiktok_pixel_enabled: false,
        tiktok_pixel_id: "",
        tiktok_events_api_enabled: false,
        tiktok_events_api_access_token_masked: "",
        has_tiktok_token: false,
        tiktok_test_event_code: "",
        ecommerce_tracking_enabled: true,
        debug_tracking_enabled: false,
        consent_mode_enabled: false,
      };
    }

    const maskToken = (token?: string | null) => {
      if (!token) return "";
      if (token.length <= 8) return "********";
      return `${"*".repeat(token.length - 4)}${token.slice(-4)}`;
    };

    return {
      id: data.id,
      gtm_enabled: data.gtm_enabled,
      gtm_container_id: data.gtm_container_id || "",
      ga4_enabled: data.ga4_enabled,
      ga4_measurement_id: data.ga4_measurement_id || "",
      meta_pixel_enabled: data.meta_pixel_enabled,
      meta_pixel_id: data.meta_pixel_id || "",
      meta_capi_enabled: data.meta_capi_enabled,
      meta_capi_access_token_masked: maskToken(data.meta_capi_access_token),
      has_meta_capi_token: Boolean(data.meta_capi_access_token),
      meta_test_event_code: data.meta_test_event_code || "",
      tiktok_pixel_enabled: data.tiktok_pixel_enabled,
      tiktok_pixel_id: data.tiktok_pixel_id || "",
      tiktok_events_api_enabled: data.tiktok_events_api_enabled,
      tiktok_events_api_access_token_masked: maskToken(data.tiktok_events_api_access_token),
      has_tiktok_token: Boolean(data.tiktok_events_api_access_token),
      tiktok_test_event_code: data.tiktok_test_event_code || "",
      ecommerce_tracking_enabled: data.ecommerce_tracking_enabled,
      debug_tracking_enabled: data.debug_tracking_enabled,
      consent_mode_enabled: data.consent_mode_enabled,
      updated_at: data.updated_at,
    };
  }

  /**
   * Update Marketing & Tracking Settings from Admin Panel
   */
  public static async updateSettings(input: AdminMarketingSettingsInput) {
    const supabase = createAdminClient();

    // 1. Fetch current settings to preserve existing tokens if masked/unmodified
    const { data: current } = await supabase
      .from("marketing_tracking_settings")
      .select("*")
      .eq("id", this.SINGLETON_ID)
      .maybeSingle();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.gtmEnabled !== undefined) updatePayload["gtm_enabled"] = input.gtmEnabled;
    if (input.gtmContainerId !== undefined) {
      const trimmed = input.gtmContainerId?.trim() || null;
      if (trimmed && !trimmed.toUpperCase().startsWith("GTM-")) {
        throw new Error("GTM Container ID must begin with 'GTM-' (e.g. GTM-XXXXXXX)");
      }
      updatePayload["gtm_container_id"] = trimmed ? trimmed.toUpperCase() : null;
    }

    if (input.ga4Enabled !== undefined) updatePayload["ga4_enabled"] = input.ga4Enabled;
    if (input.ga4MeasurementId !== undefined) {
      const trimmed = input.ga4MeasurementId?.trim() || null;
      if (trimmed && !trimmed.toUpperCase().startsWith("G-")) {
        throw new Error("GA4 Measurement ID must begin with 'G-' (e.g. G-XXXXXXXXXX)");
      }
      updatePayload["ga4_measurement_id"] = trimmed ? trimmed.toUpperCase() : null;
    }

    if (input.metaPixelEnabled !== undefined) updatePayload["meta_pixel_enabled"] = input.metaPixelEnabled;
    if (input.metaPixelId !== undefined) updatePayload["meta_pixel_id"] = input.metaPixelId?.trim() || null;

    if (input.metaCapiEnabled !== undefined) updatePayload["meta_capi_enabled"] = input.metaCapiEnabled;
    if (input.metaCapiAccessToken !== undefined) {
      // Only update if token is newly entered and not a mask
      if (input.metaCapiAccessToken && !input.metaCapiAccessToken.includes("*")) {
        updatePayload["meta_capi_access_token"] = input.metaCapiAccessToken.trim();
      } else if (input.metaCapiAccessToken === "") {
        updatePayload["meta_capi_access_token"] = null;
      }
    }
    if (input.metaTestEventCode !== undefined) updatePayload["meta_test_event_code"] = input.metaTestEventCode?.trim() || null;

    if (input.tiktokPixelEnabled !== undefined) updatePayload["tiktok_pixel_enabled"] = input.tiktokPixelEnabled;
    if (input.tiktokPixelId !== undefined) updatePayload["tiktok_pixel_id"] = input.tiktokPixelId?.trim() || null;

    if (input.tiktokEventsApiEnabled !== undefined) updatePayload["tiktok_events_api_enabled"] = input.tiktokEventsApiEnabled;
    if (input.tiktokEventsApiAccessToken !== undefined) {
      if (input.tiktokEventsApiAccessToken && !input.tiktokEventsApiAccessToken.includes("*")) {
        updatePayload["tiktok_events_api_access_token"] = input.tiktokEventsApiAccessToken.trim();
      } else if (input.tiktokEventsApiAccessToken === "") {
        updatePayload["tiktok_events_api_access_token"] = null;
      }
    }
    if (input.tiktokTestEventCode !== undefined) updatePayload["tiktok_test_event_code"] = input.tiktokTestEventCode?.trim() || null;

    if (input.ecommerceTrackingEnabled !== undefined) updatePayload["ecommerce_tracking_enabled"] = input.ecommerceTrackingEnabled;
    if (input.debugTrackingEnabled !== undefined) updatePayload["debug_tracking_enabled"] = input.debugTrackingEnabled;
    if (input.consentModeEnabled !== undefined) updatePayload["consent_mode_enabled"] = input.consentModeEnabled;

    const { data: updated, error } = await supabase
      .from("marketing_tracking_settings")
      .upsert({
        id: this.SINGLETON_ID,
        ...current,
        ...updatePayload,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to update marketing tracking settings", error, "MarketingTrackingService");
      throw error;
    }

    return updated;
  }

  /**
   * Helper to SHA256 hash customer identity fields according to Meta & TikTok privacy standards
   */
  public static sha256(val?: string | null): string | undefined {
    if (!val) return undefined;
    const clean = val.trim().toLowerCase();
    if (!clean) return undefined;
    return crypto.createHash("sha256").update(clean).digest("hex");
  }

  /**
   * Dispatch Server-Side Conversion Event to Meta CAPI & TikTok Events API
   * Asynchronous, resilient, and logged in server_analytics_logs.
   */
  public static async dispatchServerConversion(event: ServerConversionEvent): Promise<void> {
    const supabase = createAdminClient();

    // 1. Fetch live raw settings
    const { data: settings } = await supabase
      .from("marketing_tracking_settings")
      .select("*")
      .eq("id", this.SINGLETON_ID)
      .maybeSingle();

    if (!settings) return;

    const currentUnixTime = Math.floor(Date.now() / 1000);
    const emailHash = this.sha256(event.customer?.email);
    const phoneHash = event.customer?.phone
      ? this.sha256(event.customer.phone.replace(/[^0-9]/g, ""))
      : undefined;

    // --- A. Meta Conversions API (CAPI) ---
    if (settings.meta_capi_enabled && settings.meta_pixel_id && settings.meta_capi_access_token) {
      try {
        const metaEventName =
          event.eventName === "Purchase"
            ? "Purchase"
            : event.eventName === "InitiateCheckout"
            ? "InitiateCheckout"
            : event.eventName === "AddToCart"
            ? "AddToCart"
            : event.eventName === "ViewContent"
            ? "ViewContent"
            : "PageView";

        const metaPayload: Record<string, any> = {
          data: [
            {
              event_name: metaEventName,
              event_time: currentUnixTime,
              event_id: event.eventId, // Exact match with browser Meta Pixel
              action_source: "website",
              event_source_url: event.sourceUrl || "https://rustrevive.com",
              user_data: {
                em: emailHash ? [emailHash] : undefined,
                ph: phoneHash ? [phoneHash] : undefined,
                client_ip_address: event.customer?.ipAddress || undefined,
                client_user_agent: event.customer?.userAgent || undefined,
              },
              custom_data: {
                currency: event.currency || "BDT",
                value: event.value || 0,
                order_id: event.orderNumber || event.orderId || undefined,
                contents: event.items?.map((item) => ({
                  id: item.variantId || item.productId,
                  quantity: item.quantity,
                  item_price: item.price,
                })),
                content_type: "product",
              },
            },
          ],
        };

        if (settings.meta_test_event_code) {
          metaPayload["test_event_code"] = settings.meta_test_event_code;
        }

        const metaUrl = `https://graph.facebook.com/v19.0/${settings.meta_pixel_id}/events?access_token=${settings.meta_capi_access_token}`;
        const metaRes = await fetch(metaUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metaPayload),
        });

        const metaJson = await metaRes.json();

        // Log delivery audit
        await supabase.from("server_analytics_logs").insert({
          event_id: event.eventId,
          event_name: metaEventName,
          order_id: event.orderId || null,
          provider: "META_CAPI",
          status: metaRes.ok ? "SENT" : "FAILED",
          payload: metaPayload as any,
          response_data: metaJson,
          error_message: metaRes.ok ? null : JSON.stringify(metaJson?.error || metaJson),
          sent_at: metaRes.ok ? new Date().toISOString() : null,
        });
      } catch (err: unknown) {
        logger.error("Meta CAPI dispatch error", err, "MarketingTrackingService");
      }
    }

    // --- B. TikTok Events API ---
    if (settings.tiktok_events_api_enabled && settings.tiktok_pixel_id && settings.tiktok_events_api_access_token) {
      try {
        const tiktokEventName =
          event.eventName === "Purchase"
            ? "CompletePayment"
            : event.eventName === "InitiateCheckout"
            ? "InitiateCheckout"
            : event.eventName === "AddToCart"
            ? "AddToCart"
            : event.eventName === "ViewContent"
            ? "ViewContent"
            : "Pageview";

        const tiktokPayload: Record<string, any> = {
          event_source: "web",
          event_source_id: settings.tiktok_pixel_id,
          data: [
            {
              event: tiktokEventName,
              event_id: event.eventId, // Exact match with TikTok Pixel
              event_time: currentUnixTime,
              user: {
                email: emailHash,
                phone_number: phoneHash,
                ip: event.customer?.ipAddress || undefined,
                user_agent: event.customer?.userAgent || undefined,
              },
              properties: {
                currency: event.currency || "BDT",
                value: event.value || 0,
                order_id: event.orderNumber || event.orderId || undefined,
                contents: event.items?.map((item) => ({
                  content_id: item.variantId || item.productId,
                  content_type: "product",
                  content_name: item.title,
                  quantity: item.quantity,
                  price: item.price,
                })),
              },
            },
          ],
        };

        if (settings.tiktok_test_event_code) {
          tiktokPayload["test_event_code"] = settings.tiktok_test_event_code;
        }

        const ttRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
          method: "POST",
          headers: {
            "Access-Token": settings.tiktok_events_api_access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tiktokPayload),
        });

        const ttJson = await ttRes.json();

        // Log delivery audit
        await supabase.from("server_analytics_logs").insert({
          event_id: event.eventId,
          event_name: tiktokEventName,
          order_id: event.orderId || null,
          provider: "TIKTOK_EVENTS_API",
          status: ttRes.ok && ttJson.code === 0 ? "SENT" : "FAILED",
          payload: tiktokPayload as any,
          response_data: ttJson,
          error_message: ttRes.ok && ttJson.code === 0 ? null : JSON.stringify(ttJson),
          sent_at: ttRes.ok && ttJson.code === 0 ? new Date().toISOString() : null,
        });
      } catch (err: unknown) {
        logger.error("TikTok Events API dispatch error", err, "MarketingTrackingService");
      }
    }
  }
}
