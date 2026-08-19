import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiting store for edge execution
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  if (pathname.startsWith("/api/checkout")) {
    return { limit: 15, windowMs: 60 * 1000 }; // 15 requests/min for checkout
  }
  if (pathname.startsWith("/api/admin")) {
    return { limit: 80, windowMs: 60 * 1000 }; // 80 requests/min for admin
  }
  if (pathname.startsWith("/api/webhooks")) {
    return { limit: 150, windowMs: 60 * 1000 }; // 150 requests/min for webhooks
  }
  if (pathname.startsWith("/api/discounts/validate")) {
    return { limit: 20, windowMs: 60 * 1000 }; // 20 coupon checks/min
  }
  if (pathname.startsWith("/api")) {
    return { limit: 120, windowMs: 60 * 1000 }; // 120 general API requests/min
  }
  return { limit: 300, windowMs: 60 * 1000 }; // 300 page views/min
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static files, images, icons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon"
  ) {
    return NextResponse.next();
  }

  // Get Client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() || "127.0.0.1" : "127.0.0.1";

  const { limit, windowMs } = getRateLimitConfig(pathname);
  const rateLimitKey = `${ip}:${pathname.startsWith("/api") ? pathname.split("/").slice(0, 3).join("/") : "pages"}`;

  const now = Date.now();
  const entry = rateLimitMap.get(rateLimitKey) || { count: 0, resetTime: now + windowMs };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count += 1;
  }

  rateLimitMap.set(rateLimitKey, entry);

  const remaining = Math.max(0, limit - entry.count);
  const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

  // Rate Limit Exceeded
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

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetSeconds.toString());

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
