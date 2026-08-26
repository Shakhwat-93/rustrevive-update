import { describe, it, expect } from "vitest";
import { MarketingTrackingService } from "@/lib/services/marketing-tracking.service";
import { generateEventId } from "@/lib/analytics/tracker";

describe("Marketing Analytics & Tracking Architecture", () => {
  it("generates unique and prefixed event IDs for deduplication", () => {
    const id1 = generateEventId("order");
    const id2 = generateEventId("order");

    expect(id1.startsWith("order_")).toBe(true);
    expect(id2.startsWith("order_")).toBe(true);
    expect(id1).not.toBe(id2);
  });

  it("normalizes and SHA256 hashes customer email and phone correctly", () => {
    const rawEmail = "  User.Name@Example.Com  ";
    const hashedEmail = MarketingTrackingService.sha256(rawEmail);

    // sha256 of "user.name@example.com"
    expect(hashedEmail).toBe("ff11779f1afd0f200631b31b3063afee6070f12eb47da2d9a20e6d82a1816386");

    const rawPhone = " +880 17 12-345 678 ";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const hashedPhone = MarketingTrackingService.sha256(cleanPhone);

    expect(cleanPhone).toBe("8801712345678");
    expect(hashedPhone).toBeDefined();
    expect(hashedPhone?.length).toBe(64); // SHA-256 is 64 hex characters
  });

  it("validates GTM and GA4 format restrictions", async () => {
    await expect(
      MarketingTrackingService.updateSettings({
        gtmContainerId: "INVALID_GTM_CODE",
      })
    ).rejects.toThrow("GTM Container ID must begin with 'GTM-'");

    await expect(
      MarketingTrackingService.updateSettings({
        ga4MeasurementId: "INVALID_GA4_CODE",
      })
    ).rejects.toThrow("GA4 Measurement ID must begin with 'G-'");
  });

  it("ensures public config never exposes server-side tokens", async () => {
    const publicConfig = await MarketingTrackingService.getPublicConfig();

    // Must have public flags
    expect(typeof publicConfig.gtmEnabled).toBe("boolean");
    expect(typeof publicConfig.ga4Enabled).toBe("boolean");
    expect(typeof publicConfig.metaPixelEnabled).toBe("boolean");
    expect(typeof publicConfig.tiktokPixelEnabled).toBe("boolean");

    // Must NOT contain access tokens in any form
    expect((publicConfig as any).metaCapiAccessToken).toBeUndefined();
    expect((publicConfig as any).tiktokEventsApiAccessToken).toBeUndefined();
    expect((publicConfig as any).meta_capi_access_token).toBeUndefined();
    expect((publicConfig as any).tiktok_events_api_access_token).toBeUndefined();
  });
});
