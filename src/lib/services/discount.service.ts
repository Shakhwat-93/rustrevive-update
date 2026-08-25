import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

export type PromotionType =
  | "AMOUNT_OFF_PRODUCTS"
  | "BUY_X_GET_Y"
  | "AMOUNT_OFF_ORDER"
  | "FREE_SHIPPING";

export type PromotionMethod = "CODE" | "AUTOMATIC";

export type ValueType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE";

export interface PromotionRuleConfig {
  promotionType: PromotionType;
  method: PromotionMethod;
  valueType: ValueType;
  value: number; // percentage (e.g. 20) or fixed amount in BDT (e.g. 200)
  maximumDiscountAmount?: number | null;
  appliesTo:
    | "ALL_PRODUCTS"
    | "SPECIFIC_PRODUCTS"
    | "SPECIFIC_CATEGORIES"
    | "SPECIFIC_COLLECTIONS"
    | "SPECIFIC_VARIANTS";
  targetIds?: string[]; // IDs of products, categories, or collections
  minimumRequirementType: "NONE" | "MINIMUM_PURCHASE_AMOUNT" | "MINIMUM_QUANTITY";
  minimumPurchaseAmount?: number;
  minimumQuantity?: number;
  customerEligibility: "ALL_CUSTOMERS" | "REGISTERED_CUSTOMERS" | "GUEST_CUSTOMERS" | "SPECIFIC_CUSTOMERS";
  eligibleCustomerIds?: string[];
  usageLimit?: number | null;
  perCustomerLimit?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  combinations: {
    canCombineWithProductDiscounts: boolean;
    canCombineWithOrderDiscounts: boolean;
    canCombineWithShippingDiscounts: boolean;
  };
  buyXGetY?: {
    customerBuys: {
      type: "QUANTITY" | "AMOUNT";
      value: number; // e.g. 2
      appliesTo: "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORIES" | "SPECIFIC_COLLECTIONS";
      targetIds?: string[];
    };
    customerGets: {
      quantity: number; // e.g. 1
      appliesTo: "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORIES" | "SPECIFIC_COLLECTIONS";
      targetIds?: string[];
      rewardType: "FREE" | "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue: number; // 100 for free, 50 for 50% off, or fixed amount
    };
  };
}

export interface DiscountItemContext {
  productId: string;
  variantId?: string | null;
  categoryId?: string | null;
  collectionIds?: string[];
  unitPrice: number;
  quantity: number;
  title: string;
}

export interface ValidatePromotionResult {
  isValid: boolean;
  discountId: string;
  code: string;
  name: string;
  type: PromotionType;
  method: PromotionMethod;
  discountAmount: number;
  isFreeShipping: boolean;
  message: string;
  itemAllocations?: {
    productId: string;
    variantId?: string | null;
    discountAmount: number;
  }[];
  rules: PromotionRuleConfig;
}

// Structured Rule Encoder & Extractor (stores rules within name metadata block)
export function encodeDiscountNameAndRules(name: string, rules: PromotionRuleConfig): string {
  const cleanName = name.replace(/<!-- PROMOTION_RULES_JSON:[\s\S]*?-->/g, "").trim();
  return `${cleanName}\n<!-- PROMOTION_RULES_JSON: ${JSON.stringify(rules)} -->`;
}

export function extractDiscountNameAndRules(rawName: string, dbRow: {
  type: string;
  value: number;
  minimum_order_amount?: number | null;
  maximum_discount_amount?: number | null;
  usage_limit?: number | null;
  per_customer_limit?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
}): { displayName: string; rules: PromotionRuleConfig } {
  const match = rawName.match(/<!-- PROMOTION_RULES_JSON:\s*([\s\S]*?)\s*-->/);
  if (match && match[1]) {
    try {
      const parsedRules: PromotionRuleConfig = JSON.parse(match[1]);
      const cleanName = rawName.replace(/<!-- PROMOTION_RULES_JSON:[\s\S]*?-->/g, "").trim();
      return { displayName: cleanName || rawName, rules: parsedRules };
    } catch {
      // fallback
    }
  }

  // Synthesize canonical rules from standard columns for existing DB records
  let promoType: PromotionType = "AMOUNT_OFF_ORDER";
  if (dbRow.type === "FREE_SHIPPING") promoType = "FREE_SHIPPING";
  else if (dbRow.type === "PERCENTAGE" || dbRow.type === "FIXED_AMOUNT") promoType = "AMOUNT_OFF_ORDER";

  const defaultRules: PromotionRuleConfig = {
    promotionType: promoType,
    method: "CODE",
    valueType: dbRow.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED_AMOUNT",
    value: dbRow.value || 0,
    maximumDiscountAmount: dbRow.maximum_discount_amount || null,
    appliesTo: "ALL_PRODUCTS",
    minimumRequirementType: dbRow.minimum_order_amount ? "MINIMUM_PURCHASE_AMOUNT" : "NONE",
    minimumPurchaseAmount: dbRow.minimum_order_amount || 0,
    customerEligibility: "ALL_CUSTOMERS",
    usageLimit: dbRow.usage_limit || null,
    perCustomerLimit: dbRow.per_customer_limit || 1,
    startsAt: dbRow.starts_at || null,
    endsAt: dbRow.ends_at || null,
    combinations: {
      canCombineWithProductDiscounts: false,
      canCombineWithOrderDiscounts: false,
      canCombineWithShippingDiscounts: false,
    },
  };

  return { displayName: rawName, rules: defaultRules };
}

export class DiscountService {
  /**
   * Pure Server-Side Promotion Engine.
   * Validates code, customer, items, quantities, and Buy X Get Y allocations.
   */
  public static async validatePromotion(
    rawCode: string,
    items: DiscountItemContext[],
    shippingTotal: number = 120,
    customerId?: string | null,
    customerEmail?: string | null
  ): Promise<ValidatePromotionResult> {
    if (!rawCode || !rawCode.trim()) {
      throw new ValidationError("Discount code is required.", { field: "code" });
    }

    const code = rawCode.trim().toUpperCase();
    const supabase = createAdminClient();

    // 1. Fetch Discount by Code
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error || !discount) {
      throw new ValidationError(`Discount code "${code}" is invalid.`, { field: "code" });
    }

    // 2. Check Active Status
    if (!discount.is_active) {
      throw new ValidationError(`This discount is currently disabled.`, { field: "code" });
    }

    // 3. Extract Promotion Rules
    const { displayName, rules } = extractDiscountNameAndRules(discount.name, discount);

    // 4. Server-Side Time & Expiration Bounds
    const now = new Date();
    const startTime = rules.startsAt ? new Date(rules.startsAt) : discount.starts_at ? new Date(discount.starts_at) : null;
    const endTime = rules.endsAt ? new Date(rules.endsAt) : discount.ends_at ? new Date(discount.ends_at) : null;

    if (startTime && startTime > now) {
      throw new ValidationError(`This discount is scheduled and not yet active.`, { field: "code" });
    }
    if (endTime && endTime < now) {
      throw new ValidationError(`This discount has expired.`, { field: "code" });
    }

    // 5. Global Usage Limit Check
    const maxUsage = rules.usageLimit ?? discount.usage_limit;
    if (maxUsage && discount.usage_count >= maxUsage) {
      throw new ValidationError(`This discount has reached its maximum usage limit.`, { field: "code" });
    }

    // 6. Per-Customer Usage Limit Check
    const perCustomer = rules.perCustomerLimit ?? discount.per_customer_limit ?? 1;
    if ((customerId || customerEmail) && perCustomer) {
      let query = supabase
        .from("discount_usages")
        .select("id", { count: "exact", head: true })
        .eq("discount_id", discount.id);

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { count: customerUsages } = await query;
      if ((customerUsages || 0) >= perCustomer) {
        throw new ValidationError(`You have already utilized discount code "${code}".`, { field: "code" });
      }
    }

    // 7. Customer Eligibility Check
    if (rules.customerEligibility === "REGISTERED_CUSTOMERS" && !customerId) {
      throw new ValidationError(`This promotion is exclusive to registered accounts. Please sign in to apply.`, { field: "customer" });
    }
    if (rules.customerEligibility === "SPECIFIC_CUSTOMERS" && rules.eligibleCustomerIds && rules.eligibleCustomerIds.length > 0) {
      if (!customerId || !rules.eligibleCustomerIds.includes(customerId)) {
        throw new ValidationError(`Your customer account is not eligible for this exclusive promotion.`, { field: "customer" });
      }
    }

    // 8. Calculate Subtotal and Item Matches
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // 9. Minimum Requirements Check
    if (rules.minimumRequirementType === "MINIMUM_PURCHASE_AMOUNT") {
      const minSpend = rules.minimumPurchaseAmount || discount.minimum_order_amount || 0;
      if (subtotal < minSpend) {
        const remaining = minSpend - subtotal;
        throw new ValidationError(`Add ৳${remaining.toLocaleString()} more to your order to qualify for "${code}".`, {
          field: "minimumRequirement",
          required: minSpend,
          current: subtotal,
          remaining,
        });
      }
    } else if (rules.minimumRequirementType === "MINIMUM_QUANTITY") {
      const minQty = rules.minimumQuantity || 1;
      if (totalQuantity < minQty) {
        const remaining = minQty - totalQuantity;
        throw new ValidationError(`Add ${remaining} more item${remaining > 1 ? "s" : ""} to qualify for "${code}".`, {
          field: "minimumQuantity",
          required: minQty,
          current: totalQuantity,
          remaining,
        });
      }
    }

    // 10. Evaluate Promotion Strategies
    let discountAmount = 0;
    let isFreeShipping = false;
    const itemAllocations: { productId: string; variantId?: string | null; discountAmount: number }[] = [];

    switch (rules.promotionType) {
      case "AMOUNT_OFF_ORDER": {
        if (rules.valueType === "PERCENTAGE") {
          discountAmount = Math.round((subtotal * rules.value) / 100);
          if (rules.maximumDiscountAmount && discountAmount > rules.maximumDiscountAmount) {
            discountAmount = rules.maximumDiscountAmount;
          }
        } else {
          discountAmount = Math.min(rules.value, subtotal);
        }
        break;
      }

      case "AMOUNT_OFF_PRODUCTS": {
        // Find eligible items based on targeting
        const eligibleItems = items.filter((item) => {
          if (rules.appliesTo === "ALL_PRODUCTS") return true;
          if (rules.appliesTo === "SPECIFIC_PRODUCTS" && rules.targetIds?.includes(item.productId)) return true;
          if (rules.appliesTo === "SPECIFIC_CATEGORIES" && item.categoryId && rules.targetIds?.includes(item.categoryId)) return true;
          if (rules.appliesTo === "SPECIFIC_COLLECTIONS" && item.collectionIds?.some((c) => rules.targetIds?.includes(c))) return true;
          if (rules.appliesTo === "SPECIFIC_VARIANTS" && item.variantId && rules.targetIds?.includes(item.variantId)) return true;
          return false;
        });

        if (eligibleItems.length === 0) {
          throw new ValidationError(`This discount does not apply to the selected products in your cart.`, {
            field: "targeting",
          });
        }

        for (const item of eligibleItems) {
          const itemTotal = item.unitPrice * item.quantity;
          let itemDiscount = 0;
          if (rules.valueType === "PERCENTAGE") {
            itemDiscount = Math.round((itemTotal * rules.value) / 100);
          } else {
            // Proportionate fixed amount
            itemDiscount = Math.min(rules.value, itemTotal);
          }

          itemAllocations.push({
            productId: item.productId,
            variantId: item.variantId,
            discountAmount: itemDiscount,
          });
          discountAmount += itemDiscount;
        }

        if (rules.maximumDiscountAmount && discountAmount > rules.maximumDiscountAmount) {
          discountAmount = rules.maximumDiscountAmount;
        }
        break;
      }

      case "BUY_X_GET_Y": {
        if (!rules.buyXGetY) {
          throw new ValidationError(`Invalid Buy X Get Y promotion configuration.`, { field: "buyXGetY" });
        }

        const { customerBuys, customerGets } = rules.buyXGetY;

        // Count qualifying trigger items
        const qualifyingTriggerItems = items.filter((item) => {
          if (customerBuys.appliesTo === "ALL_PRODUCTS") return true;
          if (customerBuys.appliesTo === "SPECIFIC_PRODUCTS" && customerBuys.targetIds?.includes(item.productId)) return true;
          if (customerBuys.appliesTo === "SPECIFIC_CATEGORIES" && item.categoryId && customerBuys.targetIds?.includes(item.categoryId)) return true;
          return false;
        });

        const triggerCount = qualifyingTriggerItems.reduce((acc, i) => acc + i.quantity, 0);
        const requiredBuys = customerBuys.value || 1;

        if (triggerCount < requiredBuys) {
          const needed = requiredBuys - triggerCount;
          throw new ValidationError(`Add ${needed} more qualifying item${needed > 1 ? "s" : ""} to unlock Buy ${requiredBuys} Get ${customerGets.quantity} promotion!`, {
            field: "buyXGetY",
            needed,
          });
        }

        // How many times does this promotion trigger?
        const promoMultiplier = Math.floor(triggerCount / requiredBuys);

        // Find candidate reward items in cart
        const eligibleRewardItems = items.filter((item) => {
          if (customerGets.appliesTo === "ALL_PRODUCTS") return true;
          if (customerGets.appliesTo === "SPECIFIC_PRODUCTS" && customerGets.targetIds?.includes(item.productId)) return true;
          if (customerGets.appliesTo === "SPECIFIC_CATEGORIES" && item.categoryId && customerGets.targetIds?.includes(item.categoryId)) return true;
          return false;
        });

        if (eligibleRewardItems.length === 0) {
          throw new ValidationError(`Add your promotional reward item to the cart to receive the discount.`, {
            field: "rewardMissing",
          });
        }

        let remainingRewardUnits = customerGets.quantity * promoMultiplier;

        // Apply discount to reward items (cheapest first)
        const sortedRewards = [...eligibleRewardItems].sort((a, b) => a.unitPrice - b.unitPrice);
        for (const reward of sortedRewards) {
          if (remainingRewardUnits <= 0) break;
          const discountedUnits = Math.min(remainingRewardUnits, reward.quantity);
          const rewardTotal = reward.unitPrice * discountedUnits;

          let rewardSavings = 0;
          if (customerGets.rewardType === "FREE") {
            rewardSavings = rewardTotal; // 100% off
          } else if (customerGets.rewardType === "PERCENTAGE") {
            rewardSavings = Math.round((rewardTotal * customerGets.discountValue) / 100);
          } else {
            rewardSavings = Math.min(customerGets.discountValue * discountedUnits, rewardTotal);
          }

          discountAmount += rewardSavings;
          remainingRewardUnits -= discountedUnits;

          itemAllocations.push({
            productId: reward.productId,
            variantId: reward.variantId,
            discountAmount: rewardSavings,
          });
        }
        break;
      }

      case "FREE_SHIPPING": {
        isFreeShipping = true;
        discountAmount = shippingTotal;
        break;
      }
    }

    // Never exceed subtotal for product/order discounts
    if (!isFreeShipping && discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      isValid: true,
      discountId: discount.id,
      code: discount.code,
      name: displayName,
      type: rules.promotionType,
      method: rules.method,
      discountAmount: Math.max(0, discountAmount),
      isFreeShipping,
      message: isFreeShipping
        ? `Free nationwide shipping applied with code "${code}"!`
        : `Discount "${code}" applied: ৳${discountAmount.toLocaleString()} saved!`,
      itemAllocations: itemAllocations.length > 0 ? itemAllocations : undefined,
      rules,
    };
  }

  /**
   * Transactionally record discount redemption upon confirmed order creation
   */
  public static async recordCouponUsage(
    discountId: string,
    orderId: string,
    discountAmount: number,
    customerId?: string | null
  ) {
    const supabase = createAdminClient();

    // 1. Insert Usage Ledger Record
    await supabase.from("discount_usages").insert({
      discount_id: discountId,
      order_id: orderId,
      customer_id: customerId || null,
      discount_amount: discountAmount,
    });

    // 2. Increment usage_count on discount record
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
   * List all discounts for admin console with computed statuses
   */
  public static async listDiscounts(filters?: {
    status?: "ALL" | "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "DRAFT";
    search?: string;
  }) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("discounts")
      .select("*, discount_usages(id, discount_amount)")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to list discounts", error, "DiscountService");
      throw new Error(`Discount fetch error: ${error.message}`);
    }

    const now = new Date();

    const formatted = (data || []).map((d) => {
      const { displayName, rules } = extractDiscountNameAndRules(d.name, d);

      const startTime = rules.startsAt ? new Date(rules.startsAt) : d.starts_at ? new Date(d.starts_at) : null;
      const endTime = rules.endsAt ? new Date(rules.endsAt) : d.ends_at ? new Date(d.ends_at) : null;

      let computedStatus: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "DRAFT" = "ACTIVE";

      if (!d.is_active) {
        computedStatus = "DISABLED";
      } else if (startTime && startTime > now) {
        computedStatus = "SCHEDULED";
      } else if (endTime && endTime < now) {
        computedStatus = "EXPIRED";
      } else if (rules.usageLimit && d.usage_count >= rules.usageLimit) {
        computedStatus = "EXPIRED";
      }

      return {
        ...d,
        displayName,
        rules,
        computedStatus,
      };
    });

    if (!filters) return formatted;

    let result = formatted;
    if (filters.status && filters.status !== "ALL") {
      result = result.filter((item) => item.computedStatus === filters.status);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.displayName.toLowerCase().includes(q) ||
          item.rules.promotionType.toLowerCase().includes(q)
      );
    }

    return result;
  }

  /**
   * Get single discount by ID for admin editor
   */
  public static async getDiscountById(id: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("discounts")
      .select("*, discount_usages(id, discount_amount, created_at, customer_id, order_id)")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new ValidationError(`Discount with ID ${id} not found.`);
    }

    const { displayName, rules } = extractDiscountNameAndRules(data.name, data);
    return {
      ...data,
      displayName,
      rules,
    };
  }

  /**
   * Create new discount with comprehensive rules
   */
  public static async createDiscount(input: {
    code: string;
    name: string;
    rules: PromotionRuleConfig;
  }) {
    const supabase = createAdminClient();
    const code = input.code.trim().toUpperCase();

    // Check unique code
    const { data: existing } = await supabase
      .from("discounts")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (existing) {
      throw new ValidationError(`Discount code "${code}" already exists. Please choose a unique code.`, { field: "code" });
    }

    const compositeName = encodeDiscountNameAndRules(input.name, input.rules);

    let dbType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING" = "PERCENTAGE";
    if (input.rules.promotionType === "FREE_SHIPPING") {
      dbType = "FREE_SHIPPING";
    } else if (input.rules.valueType === "FIXED_AMOUNT") {
      dbType = "FIXED_AMOUNT";
    }

    const { data, error } = await supabase
      .from("discounts")
      .insert({
        code,
        name: compositeName,
        type: dbType,
        value: input.rules.value || (input.rules.promotionType === "FREE_SHIPPING" ? 120 : 0),
        minimum_order_amount: input.rules.minimumPurchaseAmount || 0,
        maximum_discount_amount: input.rules.maximumDiscountAmount || null,
        usage_limit: input.rules.usageLimit || null,
        per_customer_limit: input.rules.perCustomerLimit || 1,
        starts_at: input.rules.startsAt || null,
        ends_at: input.rules.endsAt || null,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to create discount: ${error?.message}`);
    }

    return data;
  }

  /**
   * Update existing discount rules
   */
  public static async updateDiscount(
    id: string,
    input: {
      name?: string;
      is_active?: boolean;
      rules?: PromotionRuleConfig;
    }
  ) {
    const supabase = createAdminClient();

    const { data: current } = await supabase
      .from("discounts")
      .select("*")
      .eq("id", id)
      .single();

    if (!current) {
      throw new ValidationError(`Discount with ID ${id} not found.`);
    }

    const currentExt = extractDiscountNameAndRules(current.name, current);
    const updatedName = input.name || currentExt.displayName;
    const updatedRules = input.rules || currentExt.rules;
    const compositeName = encodeDiscountNameAndRules(updatedName, updatedRules);

    let dbType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING" = "PERCENTAGE";
    if (updatedRules.promotionType === "FREE_SHIPPING") {
      dbType = "FREE_SHIPPING";
    } else if (updatedRules.valueType === "FIXED_AMOUNT") {
      dbType = "FIXED_AMOUNT";
    }

    const { data, error } = await supabase
      .from("discounts")
      .update({
        name: compositeName,
        type: dbType,
        value: updatedRules.value || (updatedRules.promotionType === "FREE_SHIPPING" ? 120 : 0),
        minimum_order_amount: updatedRules.minimumPurchaseAmount || 0,
        maximum_discount_amount: updatedRules.maximumDiscountAmount || null,
        usage_limit: updatedRules.usageLimit || null,
        per_customer_limit: updatedRules.perCustomerLimit || 1,
        starts_at: updatedRules.startsAt || null,
        ends_at: updatedRules.endsAt || null,
        is_active: input.is_active !== undefined ? input.is_active : current.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to update discount: ${error?.message}`);
    }

    return data;
  }

  /**
   * Soft-disable / archive discount
   */
  public static async toggleDiscountStatus(id: string, is_active: boolean) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("discounts")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to toggle discount: ${error?.message}`);
    }

    return data;
  }
}
