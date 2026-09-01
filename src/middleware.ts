import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// In-memory rate limiting store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  if (pathname.startsWith("/api/checkout")) return { limit: 15, windowMs: 60_000 };
  // Visitor heartbeat: generous limit — browsers send max 2-3 per minute
  if (pathname === "/api/visitor/heartbeat") return { limit: 120, windowMs: 60_000 };
  if (pathname.startsWith("/api/admin")) return { limit: 80, windowMs: 60_000 };
  if (pathname.startsWith("/api/webhooks")) return { limit: 150, windowMs: 60_000 };
  if (pathname.startsWith("/api/discounts/validate")) return { limit: 20, windowMs: 60_000 };
  if (pathname.startsWith("/api")) return { limit: 120, windowMs: 60_000 };
  return { limit: 300, windowMs: 60_000 };
}

// Protected routes that require authentication
const PROTECTED_PREFIXES = ["/account"];

// Auth routes — redirect to account if already logged in
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// Safe internal redirect paths for auth callbacks
function isSafeRedirect(url: string, origin: string): boolean {
  try {
    const parsed = new URL(url, origin);
    return parsed.origin === origin && !parsed.pathname.startsWith("/admin");
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon"
  ) {
    return NextResponse.next();
  }

  // ─── RATE LIMITING ──────────────────────────────────────────────────────────
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? (forwardedFor.split(",")[0]?.trim() ?? "127.0.0.1") : "127.0.0.1";
  const { limit, windowMs } = getRateLimitConfig(pathname);
  const rateLimitKey = `${ip}:${pathname.startsWith("/api") ? pathname.split("/").slice(0, 3).join("/") : "pages"}`;

  const now = Date.now();
  const entry = rateLimitMap.get(rateLimitKey) ?? { count: 0, resetTime: now + windowMs };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count += 1;
  }
  rateLimitMap.set(rateLimitKey, entry);

  const remaining = Math.max(0, limit - entry.count);
  const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

  if (entry.count > limit) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please slow down.",
          details: { retryAfterSeconds: resetSeconds },
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": resetSeconds.toString(),
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetSeconds.toString(),
        },
      }
    );
  }

  // ─── SESSION REFRESH via Supabase SSR ───────────────────────────────────────
  // This is required for Supabase to refresh expired access tokens via cookies.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ─── PROTECTED ROUTE GUARD ───────────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    const redirectTo = pathname + request.nextUrl.search;
    if (isSafeRedirect(redirectTo, request.nextUrl.origin)) {
      loginUrl.searchParams.set("redirect", redirectTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  // ─── AUTH ROUTE REDIRECT (logged-in users go to /account) ───────────────────
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "?"));
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  // ─── RATE LIMIT HEADERS ──────────────────────────────────────────────────────
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetSeconds.toString());

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
