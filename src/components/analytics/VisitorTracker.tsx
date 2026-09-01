"use client";

/**
 * VisitorTrackerComponent
 *
 * Renders null — exists purely to:
 * 1. Initialize the VisitorTracker singleton on first mount
 * 2. Detect Next.js App Router route changes via usePathname()
 * 3. Update current page and start heartbeat
 * 4. Clean up on unmount (tab close / navigation away from app)
 *
 * Mount this ONCE in the root layout (storefront only, not admin).
 * It is completely transparent — no UI, no DOM, no blocking.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { VisitorTracker } from "@/lib/visitor/tracker";

export function VisitorTrackerComponent() {
  const pathname = usePathname();
  const isInitialized = useRef(false);
  const prevPathRef = useRef<string | null>(null);

  // Initialize once on first mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    VisitorTracker.initialize();
    VisitorTracker.updatePage(pathname ?? "/");
    VisitorTracker.startHeartbeat();

    prevPathRef.current = pathname;

    return () => {
      VisitorTracker.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track route changes (SPA navigation via App Router)
  useEffect(() => {
    if (!isInitialized.current) return;
    if (prevPathRef.current === pathname) return; // Same path — no-op

    prevPathRef.current = pathname;
    VisitorTracker.updatePage(pathname ?? "/");
  }, [pathname]);

  return null;
}
