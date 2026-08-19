import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /auth/callback
 * OAuth and Email Verification PKCE code exchange.
 * Handles: Google, Facebook OAuth, Email Verification, and Magic Links.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("[auth/callback] OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("We couldn't complete sign-in. Please try again.")}`, origin)
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[auth/callback] Code exchange error:", exchangeError.message);
      return NextResponse.redirect(
        new URL("/login?error=" + encodeURIComponent("Verification failed. Please try signing in again."), origin)
      );
    }

    // Validate next is safe internal redirect
    let redirectTo = "/account";
    try {
      const nextUrl = new URL(next, origin);
      if (nextUrl.origin === origin && !next.startsWith("/admin")) {
        redirectTo = next;
      }
    } catch {
      redirectTo = "/account";
    }

    return NextResponse.redirect(new URL(redirectTo, origin));
  }

  // No code present — redirect to login
  return NextResponse.redirect(new URL("/login", origin));
}
