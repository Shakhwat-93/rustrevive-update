import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/server";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

import { DiscountService, type ValidatePromotionResult, type DiscountItemContext } from "@/lib/services/discount.service";

export interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface ValidatedLineItem {
  productId: string;
  variantId: string | null;
  productTitle: string;
  variantTitle: string | null;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
  discountAllocated?: number;
}

export interface OrderPricingSummary {
  items: ValidatedLineItem[];
  itemCount: number;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  shippingMethodName: string;
  appliedDiscount?: ValidatePromotionResult | null;
}

interface DBProductRow {
  id: string;
  title: string;
  sku: string;
  base_price: number;
  status: string;
  is_active: boolean;
  product_media?: { is_primary: boolean; media?: { public_url?: string } }[];
  inventory?: { id: string; quantity: number; reserved_quantity: number }[];
}

export class CheckoutService {
  /**
   * Fetch active shipping methods from database
   */
  public static async getActiveShippingMethods() {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("shipping_methods")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Failed to fetch shipping methods", error, "CheckoutService");
      return [
        {
          id: "default-standard",
          name: "Standard Nationwide Delivery",
          description: "Delivered within 3–5 business days",
          price: 120,
          estimated_days: "3-5 business days",
          is_active: true,
          sort_order: 1,
        },
      ];
    }

    return data || [];
  }

  /**
   * Pure Server-Side Financial & Stock Validation Engine.
   * Calculates subtotal, shipping, discount, and grand total.
   * NEVER TRUSTS ANY CLIENT-SUPPLIED PRICES OR TOTALS.
   */
  public static async calculateOrderSummary(
    items: CartItemInput[],
    shippingMethodId?: string,
    couponCode?: string | null,
    customerId?: string | null,
    customerEmail?: string | null
  ): Promise<OrderPricingSummary> {
    if (!items || items.length === 0) {
      throw new ValidationError("Cart is empty. Please add items to proceed.", { field: "items" });
    }

    const supabase = createAdminClient();
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const variantIds = items.map((i) => i.variantId).filter(Boolean) as string[];

    // 1. Fetch active products with primary media, category & inventory
    const { data: rawProducts, error: prodErr } = await supabase
      .from("products")
      .select(`
        id,
        title,
        sku,
        base_price,
        category_id,
        status,
        is_active,
        product_media(is_primary, media(public_url)),
        inventory(id, quantity, reserved_quantity)
      `)
      .in("id", productIds);

    if (prodErr || !rawProducts) {
      logger.error("Failed to query products for checkout", prodErr, "CheckoutService");
      throw new Error("Unable to validate cart products at this time.");
    }

    const dbProducts = rawProducts as unknown as (DBProductRow & { category_id?: string | null })[];

    // 2. Fetch variants if requested
    let dbVariants: {
      id: string;
      product_id: string;
      title: string;
      sku: string;
      price: number;
      is_active: boolean;
      inventory?: { quantity: number; reserved_quantity: number }[];
    }[] = [];

    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select(`
          id,
          product_id,
          title,
          sku,
          price,
          is_active,
          inventory(id, quantity, reserved_quantity)
        `)
        .in("id", variantIds);

      if (variantsData) {
        dbVariants = variantsData as unknown as typeof dbVariants;
      }
    }

    // 3. Match and Validate Every Cart Item
    const validatedItems: ValidatedLineItem[] = [];
    const discountContextItems: DiscountItemContext[] = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Math.max(1, Math.floor(item.quantity));
      const product = dbProducts.find((p) => p.id === item.productId);

      if (!product || !product.is_active || product.status !== "ACTIVE") {
        throw new ValidationError(`Product "${product?.title || item.productId}" is no longer active.`, {
          productId: item.productId,
        });
      }

      // Extract primary image
      let imageUrl: string | null = null;
      if (product.product_media && product.product_media.length > 0) {
        const primary = product.product_media.find((pm) => pm.is_primary) || product.product_media[0];
        imageUrl = primary?.media?.public_url || null;
      }

      if (item.variantId) {
        const variant = dbVariants.find((v) => v.id === item.variantId && v.product_id === product.id);
        if (!variant || !variant.is_active) {
          throw new ValidationError(`Selected variant for "${product.title}" is no longer available.`, {
            variantId: item.variantId,
          });
        }

        // Calculate available stock
        const inv = variant.inventory?.[0];
        const availableStock = inv ? Math.max(0, inv.quantity - inv.reserved_quantity) : 0;

        if (availableStock < quantity) {
          throw new ValidationError(
            `Insufficient stock for "${product.title} - ${variant.title}". Available: ${availableStock}, Requested: ${quantity}`,
            { variantId: variant.id, available: availableStock, requested: quantity }
          );
        }

        const unitPrice = variant.price;
        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;

        validatedItems.push({
          productId: product.id,
          variantId: variant.id,
          productTitle: product.title,
          variantTitle: variant.title,
          sku: variant.sku,
          imageUrl,
          unitPrice,
          quantity,
          lineTotal,
          availableStock,
        });

        discountContextItems.push({
          productId: product.id,
          variantId: variant.id,
          categoryId: product.category_id,
          unitPrice,
          quantity,
          title: `${product.title} (${variant.title})`,
        });
      } else {
        // Base product without variants
        const inv = product.inventory?.[0];
        const availableStock = inv ? Math.max(0, inv.quantity - inv.reserved_quantity) : 0;

        if (availableStock < quantity) {
          throw new ValidationError(
            `Insufficient stock for "${product.title}". Available: ${availableStock}, Requested: ${quantity}`,
            { productId: product.id, available: availableStock, requested: quantity }
          );
        }

        const unitPrice = product.base_price;
        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;

        validatedItems.push({
          productId: product.id,
          variantId: null,
          productTitle: product.title,
          variantTitle: null,
          sku: product.sku,
          imageUrl,
          unitPrice,
          quantity,
          lineTotal,
          availableStock,
        });

        discountContextItems.push({
          productId: product.id,
          variantId: null,
          categoryId: product.category_id,
          unitPrice,
          quantity,
          title: product.title,
        });
      }
    }

    // 4. Calculate Shipping Server-Side
    let shippingTotal = 120; // Default nationwide shipping BDT
    let shippingMethodName = "Standard Nationwide Delivery";

    if (shippingMethodId) {
      const { data: shipMethod } = await supabase
        .from("shipping_methods")
        .select("name, price")
        .eq("id", shippingMethodId)
        .eq("is_active", true)
        .single();

      if (shipMethod) {
        shippingTotal = shipMethod.price;
        shippingMethodName = shipMethod.name;
      }
    }

    // 5. Pure Server-Side Promotion Engine Evaluation
    let discountTotal = 0;
    let appliedDiscount: ValidatePromotionResult | null = null;

    if (couponCode && couponCode.trim()) {
      appliedDiscount = await DiscountService.validatePromotion(
        couponCode.trim(),
        discountContextItems,
        shippingTotal,
        customerId,
        customerEmail
      );

      if (appliedDiscount.isFreeShipping) {
        discountTotal += shippingTotal;
        shippingTotal = 0;
      } else {
        discountTotal = appliedDiscount.discountAmount;
      }

      // Distribute line-item allocations if any
      if (appliedDiscount.itemAllocations) {
        for (const alloc of appliedDiscount.itemAllocations) {
          const matchedItem = validatedItems.find(
            (i) => i.productId === alloc.productId && i.variantId === alloc.variantId
          );
          if (matchedItem) {
            matchedItem.discountAllocated = alloc.discountAmount;
          }
        }
      }
    }

    const taxTotal = 0;
    const grandTotal = Math.max(0, subtotal + shippingTotal + taxTotal - (appliedDiscount?.isFreeShipping ? 0 : discountTotal));

    return {
      items: validatedItems,
      itemCount: validatedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      shippingTotal,
      discountTotal,
      taxTotal,
      grandTotal,
      currency: "BDT",
      shippingMethodName,
      appliedDiscount,
    };
  }
}
