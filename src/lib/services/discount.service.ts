import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { DiscountType } from "@/types/database.types";

export interface ValidateCouponResult {
  isValid: boolean;
  discountId: string;
  code: string;
  type: DiscountType;
  discountAmount: number;
  message: string;
}

export class DiscountService {
  /**
   * Pure Server-Side Coupon Validator
   */
  public static async validateCoupon(
    rawCode: string,
    subtotal: number,
    customerId?: string
  ): Promise<ValidateCouponResult> {
    if (!rawCode || !rawCode.trim()) {
      throw new ValidationError("Coupon code is required.", { field: "code" });
    }

    const code = rawCode.trim().toUpperCase();
    const supabase = createAdminClient();

    // 1. Fetch Coupon
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error || !discount) {
      throw new ValidationError(`Coupon code "${code}" is invalid.`, { field: "code" });
    }

    // 2. Check Active Status
    if (!discount.is_active) {
      throw new ValidationError(`Coupon "${code}" is no longer active.`, { field: "code" });
    }

    // 3. Check Date Bounds
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      throw new ValidationError(`Coupon "${code}" is not yet active.`, { field: "code" });
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      throw new ValidationError(`Coupon "${code}" has expired.`, { field: "code" });
    }

    // 4. Check Global Usage Limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      throw new ValidationError(`Coupon "${code}" has reached its maximum redemption limit.`, { field: "code" });
    }

    // 5. Check Minimum Order Amount
    if (subtotal < (discount.minimum_order_amount || 0)) {
      throw new ValidationError(
        `Coupon "${code}" requires a minimum order subtotal of ৳${discount.minimum_order_amount.toLocaleString()}.`,
        { field: "code", minRequired: discount.minimum_order_amount, currentSubtotal: subtotal }
      );
    }

    // 6. Check Per-Customer Usage Limit
    if (customerId && discount.per_customer_limit) {
      const { count: customerUsages } = await supabase
        .from("discount_usages")
        .select("id", { count: "exact", head: true })
        .eq("discount_id", discount.id)
        .eq("customer_id", customerId);

      if ((customerUsages || 0) >= discount.per_customer_limit) {
        throw new ValidationError(`You have already utilized coupon "${code}".`, { field: "code" });
      }
    }

    // 7. Calculate Discount Amount Server-Side
    let discountAmount = 0;
    if (discount.type === "PERCENTAGE") {
      discountAmount = Math.round((subtotal * discount.value) / 100);
      if (discount.maximum_discount_amount && discountAmount > discount.maximum_discount_amount) {
        discountAmount = discount.maximum_discount_amount;
      }
    } else if (discount.type === "FIXED_AMOUNT") {
      discountAmount = Math.min(discount.value, subtotal);
    } else if (discount.type === "FREE_SHIPPING") {
      discountAmount = 120; // Standard shipping rate
    }

    return {
      isValid: true,
      discountId: discount.id,
      code: discount.code,
      type: discount.type,
      discountAmount,
      message: `Coupon "${discount.code}" applied: ৳${discountAmount.toLocaleString()} saved!`,
    };
  }

  /**
   * Transactionally record coupon usage on order completion
   */
  public static async recordCouponUsage(
    discountId: string,
    orderId: string,
    discountAmount: number,
    customerId?: string | null
  ) {
    const supabase = createAdminClient();

    // 1. Log Usage Record
    await supabase.from("discount_usages").insert({
      discount_id: discountId,
      order_id: orderId,
      customer_id: customerId || null,
      discount_amount: discountAmount,
    });

    // 2. Increment usage_count on discount table
    const { data: current } = await supabase
      .from("discounts")
      .select("usage_count")
      .eq("id", discountId)
      .single();

    if (current) {
      await supabase
        .from("discounts")
        .update({
          usage_count: (current.usage_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", discountId);
    }
  }

  /**
   * List all discounts for admin console
   */
  public static async listDiscounts() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("discounts")
      .select("*, discount_usages(id, discount_amount)")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to list discounts", error, "DiscountService");
      throw new Error(`Discount fetch error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create or update coupon
   */
  public static async createDiscount(input: {
    code: string;
    name: string;
    type: DiscountType;
    value: number;
    minimum_order_amount?: number;
    maximum_discount_amount?: number;
    usage_limit?: number;
    per_customer_limit?: number;
    starts_at?: string;
    ends_at?: string;
  }) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("discounts")
      .insert({
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        type: input.type,
        value: input.value,
        minimum_order_amount: input.minimum_order_amount || 0,
        maximum_discount_amount: input.maximum_discount_amount || null,
        usage_limit: input.usage_limit || null,
        per_customer_limit: input.per_customer_limit || 1,
        starts_at: input.starts_at || null,
        ends_at: input.ends_at || null,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to create discount: ${error?.message}`);
    }

    return data;
  }
}
