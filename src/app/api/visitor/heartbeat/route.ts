import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const ACTIVE_WINDOW_SECONDS = 90;

// ---------------------------------------------------------------------------
// DEVICE / BROWSER / OS DETECTION
// Pure UA-based — no fingerprinting, no tracking beyond session context
// ---------------------------------------------------------------------------
function detectDevice(ua: string): "MOBILE" | "TABLET" | "DESKTOP" {
  const u = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(u)) return "TABLET";
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(u)) return "MOBILE";
  return "DESKTOP";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/msie|trident/i.test(ua)) return "IE";
  return "Other";
}

function detectOS(ua: string): string {
  if (/windows phone/i.test(ua)) return "Windows Phone";
  if (/win/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

// ---------------------------------------------------------------------------
// VALID PAGE TYPES
// ---------------------------------------------------------------------------
const VALID_PAGE_TYPES = new Set([
  "HOME", "PRODUCT", "CATEGORY", "SEARCH", "CART",
  "CHECKOUT", "ACCOUNT", "CONTACT", "ABOUT", "CUSTOM", "OTHER",
]);

// ---------------------------------------------------------------------------
// POST /api/visitor/heartbeat
// Public endpoint — no auth required.
// Upserts a visitor row using service role client (bypasses RLS for write).
// The table's RLS still prevents public clients from reading any visitor data.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const {
      visitor_id,
      session_id,
      tab_id,
      current_path,
      page_title,
      page_type,
      product_id,
      category_id,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body as Record<string, unknown>;

    // Validate required fields (IDs and string path)
    if (
      typeof visitor_id !== "string" || visitor_id.length > 100 || visitor_id.trim().length === 0 ||
      typeof session_id !== "string" || session_id.length > 100 || session_id.trim().length === 0 ||
      typeof current_path !== "string" || current_path.length > 500
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const safePageType = VALID_PAGE_TYPES.has(String(page_type ?? "OTHER").toUpperCase())
      ? String(page_type).toUpperCase()
      : "OTHER";

    const ua = req.headers.get("user-agent") ?? "";

    // Use service role client — writes bypass RLS, but we validate inputs above
    const supabase = createAdminClient();

    const upsertData = {
      visitor_id,
      session_id,
      tab_id: typeof tab_id === "string" ? tab_id.slice(0, 100) : null,
      current_path: String(current_path).slice(0, 500),
      page_title: typeof page_title === "string" ? page_title.slice(0, 200) : null,
      page_type: safePageType,
      product_id: typeof product_id === "string" && product_id.length <= 100 && product_id.trim().length > 0 ? product_id : null,
      category_id: typeof category_id === "string" && category_id.length <= 100 && category_id.trim().length > 0 ? category_id : null,
      device_type: detectDevice(ua),
      browser: detectBrowser(ua),
      os: detectOS(ua),
      referrer: typeof referrer === "string" ? referrer.slice(0, 200) : null,
      utm_source: typeof utm_source === "string" ? utm_source.slice(0, 100) : null,
      utm_medium: typeof utm_medium === "string" ? utm_medium.slice(0, 100) : null,
      utm_campaign: typeof utm_campaign === "string" ? utm_campaign.slice(0, 100) : null,
      last_seen_at: new Date().toISOString(),
      is_active: true,
    };

    const { error } = await supabase
      .from("live_visitors")
      .upsert(upsertData, {
        onConflict: "visitor_id,session_id",
        ignoreDuplicates: false,
      });

    if (error) {
      logger.warn("live_visitors upsert error", "VisitorHeartbeatPOST", { message: error.message });
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // Trigger lightweight cleanup of stale sessions (async, non-blocking)
    void supabase.rpc("cleanup_stale_visitors", { active_window_seconds: ACTIVE_WINDOW_SECONDS }).then(() => {
      // Cleanup is best-effort; ignore errors
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("POST /api/visitor/heartbeat unhandled", err, "VisitorHeartbeatPOST");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Disable body size limit for beacon compatibility
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
