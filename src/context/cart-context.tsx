"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  quantity: number;
  availableStock?: number;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
  isQuantityAdjusted?: boolean;
  categoryId?: string | null;
  statusMessage?: string | null;
}

export interface StoredCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: string;
}

export interface AppliedCouponInfo {
  code: string;
  name: string;
  discountAmount: number;
  isFreeShipping: boolean;
  message: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  cartSessionId: string;
  isRehydrating: boolean;
  rehydrationWarnings: string[];
  appliedCoupon: AppliedCouponInfo | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  clearWarnings: () => void;
  rehydrateCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string; discountAmount?: number }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_V2 = "rustrevive_cart_v2";
const CART_STORAGE_LEGACY = "rustrevive_cart_v1";
const CART_SESSION_KEY = "rustrevive_cart_session_id";
const COUPON_STORAGE_KEY = "rustrevive_applied_coupon_v1";
const LAST_ACTIVE_KEY = "rustrevive_last_active_at";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [cartSessionId, setCartSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(false);
  const [rehydrationWarnings, setRehydrationWarnings] = useState<string[]>([]);
  const isRehydratingRef = useRef(false);

  // Initialize or restore stable cart session ID
  useEffect(() => {
    try {
      let sessionId = localStorage.getItem(CART_SESSION_KEY);
      if (!sessionId) {
        sessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(CART_SESSION_KEY, sessionId);
      }
      setCartSessionId(sessionId);

      // Record activity timestamp for recovery reminder
      localStorage.setItem(LAST_ACTIVE_KEY, new Date().toISOString());
    } catch {
      // Storage unavailable fallback
      setCartSessionId(`cs_fallback_${Date.now()}`);
    }
  }, []);

  // Server-side authoritative rehydration
  const rehydrateWithServer = useCallback(async (candidateItems: StoredCartItem[]) => {
    if (candidateItems.length === 0) {
      setItems([]);
      return;
    }

    if (isRehydratingRef.current) return;
    isRehydratingRef.current = true;
    setIsRehydrating(true);

    try {
      const res = await fetch("/api/cart/rehydrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: candidateItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            quantity: i.quantity,
          })),
        }),
      });

      const json = await res.json();
      if (res.ok && json?.data?.items) {
        const rehydratedItems: CartItem[] = json.data.items.map((srv: any) => ({
          productId: srv.productId,
          variantId: srv.variantId || undefined,
          title: srv.title,
          variantTitle: srv.variantTitle || undefined,
          sku: srv.sku,
          price: srv.price,
          compareAtPrice: srv.compareAtPrice,
          imageUrl: srv.imageUrl || undefined,
          quantity: srv.quantity > 0 ? srv.quantity : srv.requestedQuantity,
          availableStock: srv.availableStock,
          isAvailable: srv.isAvailable,
          isOutOfStock: srv.isOutOfStock,
          isQuantityAdjusted: srv.isQuantityAdjusted,
          categoryId: srv.categoryId,
          statusMessage: srv.statusMessage,
        }));

        setItems(rehydratedItems);

        if (Array.isArray(json.data.warnings) && json.data.warnings.length > 0) {
          setRehydrationWarnings((prev) => Array.from(new Set([...prev, ...json.data.warnings])));
        }
      }
    } catch (err) {
      console.warn("Cart rehydration skipped (offline or network error):", err);
    } finally {
      setIsRehydrating(false);
      isRehydratingRef.current = false;
    }
  }, []);

  // Initial load from storage + rehydration
  useEffect(() => {
    try {
      let storedList: StoredCartItem[] = [];

      // Try V2 minimal schema first
      const storedV2 = localStorage.getItem(CART_STORAGE_V2);
      if (storedV2) {
        storedList = JSON.parse(storedV2);
      } else {
        // Fallback to legacy V1 and migrate
        const storedV1 = localStorage.getItem(CART_STORAGE_LEGACY);
        if (storedV1) {
          const parsed = JSON.parse(storedV1);
          if (Array.isArray(parsed)) {
            storedList = parsed.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId || undefined,
              quantity: item.quantity || 1,
              addedAt: new Date().toISOString(),
            }));
            // Optimistically set full items from legacy while rehydrating
            setItems(parsed);
          }
        }
      }

      if (storedList.length > 0) {
        rehydrateWithServer(storedList);
      }

      const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) {
        setAppliedCoupon(JSON.parse(storedCoupon));
      }
    } catch {
      // Ignored
    } finally {
      setIsInitialized(true);
    }
  }, [rehydrateWithServer]);

  // Persist minimal cart state to localStorage (V2)
  useEffect(() => {
    if (isInitialized) {
      try {
        const minimalItems: StoredCartItem[] = items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
          addedAt: new Date().toISOString(),
        }));
        localStorage.setItem(CART_STORAGE_V2, JSON.stringify(minimalItems));
        // Keep legacy key in sync for backwards compatibility
        localStorage.setItem(CART_STORAGE_LEGACY, JSON.stringify(items));
      } catch {
        // Storage full or private mode
      }
    }
  }, [items, isInitialized]);

  // Persist coupon to localStorage
  useEffect(() => {
    if (isInitialized) {
      try {
        if (appliedCoupon) {
          localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
        } else {
          localStorage.removeItem(COUPON_STORAGE_KEY);
        }
      } catch {
        // Ignored
      }
    }
  }, [appliedCoupon, isInitialized]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const clearWarnings = useCallback(() => {
    setRehydrationWarnings([]);
  }, []);

  const rehydrateCart = useCallback(async () => {
    const minimal: StoredCartItem[] = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId || undefined,
      quantity: i.quantity,
      addedAt: new Date().toISOString(),
    }));
    await rehydrateWithServer(minimal);
  }, [items, rehydrateWithServer]);

  // Recalculate or auto-detach coupon on item changes
  const revalidateCoupon = useCallback(async (couponCode: string, currentItems: CartItem[]) => {
    if (currentItems.length === 0) {
      setAppliedCoupon(null);
      return;
    }

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          items: currentItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            categoryId: i.categoryId || null,
            unitPrice: i.price,
            quantity: i.quantity,
            title: i.title,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data?.data?.isValid) {
        setAppliedCoupon({
          code: data.data.code,
          name: data.data.name,
          discountAmount: data.data.discountAmount,
          isFreeShipping: data.data.isFreeShipping,
          message: data.data.message,
        });
      } else {
        setAppliedCoupon(null);
      }
    } catch {
      // Ignored
    }
  }, []);

  const addItem = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      let updated: CartItem[];
      if (existingIdx > -1) {
        updated = [...prev];
        const existing = updated[existingIdx];
        if (existing) {
          updated[existingIdx] = {
            ...existing,
            quantity: existing.quantity + quantity,
            isAvailable: true,
            isOutOfStock: false,
          };
        }
      } else {
        updated = [...prev, { ...item, quantity, isAvailable: true, isOutOfStock: false }];
      }

      if (appliedCoupon) {
        revalidateCoupon(appliedCoupon.code, updated);
      }
      return updated;
    });
    setIsOpen(true);
  };

  const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.productId === productId && item.variantId === variantId) {
          return { ...item, quantity };
        }
        return item;
      });

      if (appliedCoupon) {
        revalidateCoupon(appliedCoupon.code, updated);
      }
      return updated;
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => !(i.productId === productId && i.variantId === variantId));
      if (appliedCoupon) {
        revalidateCoupon(appliedCoupon.code, updated);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setRehydrationWarnings([]);
    try {
      localStorage.removeItem(CART_STORAGE_V2);
      localStorage.removeItem(CART_STORAGE_LEGACY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {
      // Ignored
    }
  };

  const applyCoupon = async (code: string) => {
    if (!code || !code.trim()) {
      return { success: false, message: "Please enter a discount code." };
    }

    if (items.length === 0) {
      return { success: false, message: "Your cart is empty. Add items first." };
    }

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            categoryId: i.categoryId || null,
            unitPrice: i.price,
            quantity: i.quantity,
            title: i.title,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.data?.isValid) {
        return {
          success: false,
          message: data?.error?.message || "Invalid or ineligible discount code.",
        };
      }

      const couponInfo: AppliedCouponInfo = {
        code: data.data.code,
        name: data.data.name,
        discountAmount: data.data.discountAmount,
        isFreeShipping: data.data.isFreeShipping,
        message: data.data.message,
      };

      setAppliedCoupon(couponInfo);
      return {
        success: true,
        message: couponInfo.message,
        discountAmount: couponInfo.discountAmount,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to apply discount.",
      };
    }
  };

  const itemCount = items.reduce((sum, item) => sum + (item.isOutOfStock ? 0 : item.quantity), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.isOutOfStock ? 0 : item.price * item.quantity),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isOpen,
        cartSessionId,
        isRehydrating,
        rehydrationWarnings,
        appliedCoupon,
        openCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        clearWarnings,
        rehydrateCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
