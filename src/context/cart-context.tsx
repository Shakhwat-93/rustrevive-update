"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  sku: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  categoryId?: string | null;
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
  appliedCoupon: AppliedCouponInfo | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string; discountAmount?: number }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "rustrevive_cart_v1";
const COUPON_STORAGE_KEY = "rustrevive_applied_coupon_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
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
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignored
      }
    }
  }, [items, isInitialized]);

  // Sync coupon to localStorage
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
        // Invalidated by cart modification
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
          };
        }
      } else {
        updated = [...prev, { ...item, quantity }];
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
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isOpen,
        appliedCoupon,
        openCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
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
