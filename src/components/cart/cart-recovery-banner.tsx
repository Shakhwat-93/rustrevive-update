"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, X, ArrowRight } from "lucide-react";
import { useCart } from "@/context/cart-context";

const REMINDER_DISMISSED_KEY = "rustrevive_cart_reminder_dismissed_at";
const PREV_SESSION_ACTIVE_KEY = "rustrevive_prev_session_active_at";
const CURRENT_ACTIVE_KEY = "rustrevive_last_active_at";

export function CartRecoveryBanner() {
  const { itemCount, openCart } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only evaluate if there are valid items in the cart
    if (itemCount === 0) {
      setIsVisible(false);
      return;
    }

    try {
      const now = Date.now();
      const lastDismissedStr = localStorage.getItem(REMINDER_DISMISSED_KEY);
      const lastDismissed = lastDismissedStr ? parseInt(lastDismissedStr, 10) : 0;

      // Throttle: Do not show if dismissed in the last 24 hours (86400000 ms)
      if (now - lastDismissed < 24 * 60 * 60 * 1000) {
        return;
      }

      // Check if user is returning after a meaningful gap (>30 minutes = 1800000 ms)
      const prevActiveStr = localStorage.getItem(PREV_SESSION_ACTIVE_KEY);
      if (prevActiveStr) {
        const prevActive = new Date(prevActiveStr).getTime();
        const gap = now - prevActive;

        if (gap > 30 * 60 * 1000) {
          // Returning customer after 30+ minutes gap -> show gentle reminder
          setIsVisible(true);
        }
      }

      // Update session markers
      const currentActive = localStorage.getItem(CURRENT_ACTIVE_KEY);
      if (currentActive) {
        localStorage.setItem(PREV_SESSION_ACTIVE_KEY, currentActive);
      }
      localStorage.setItem(CURRENT_ACTIVE_KEY, new Date().toISOString());
    } catch {
      // Ignored
    }
  }, [itemCount]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(REMINDER_DISMISSED_KEY, Date.now().toString());
    } catch {
      // Ignored
    }
  };

  const handleViewCart = () => {
    setIsVisible(false);
    openCart();
    try {
      localStorage.setItem(REMINDER_DISMISSED_KEY, Date.now().toString());
    } catch {
      // Ignored
    }
  };

  if (!isVisible || itemCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Cart Recovery Reminder"
      className="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-[#141312] text-[#fbf9f5] p-4 rounded-xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
    >
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#9e472a]/20 border border-[#9e472a]/40 flex items-center justify-center text-[#e8a382] shrink-0 mt-0.5">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-serif tracking-wide text-white font-medium">
              Your cart is waiting for you
            </p>
            <p className="text-[11px] font-mono text-white/70 mt-0.5">
              You have {itemCount} handcrafted {itemCount === 1 ? "item" : "items"} saved in your bag.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-white/50 hover:text-white transition-colors p-1 cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3.5 flex items-center justify-end space-x-2 pt-2.5 border-t border-white/10">
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 text-[11px] font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          Later
        </button>
        <button
          type="button"
          onClick={handleViewCart}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#9e472a] hover:bg-[#b55535] text-white text-[11px] font-mono font-medium rounded-md transition-colors cursor-pointer shadow-xs"
        >
          <span>View Cart</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
