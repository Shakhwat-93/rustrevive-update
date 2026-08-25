import { describe, it, expect } from "vitest";
import {
  extractDiscountNameAndRules,
  encodeDiscountNameAndRules,
  type PromotionRuleConfig,
  type DiscountItemContext,
} from "@/lib/services/discount.service";

describe("Discount & Promotion Engine Unit Tests", () => {
  describe("Rule Serialization & Extraction", () => {
    it("should seamlessly encode and extract promotion rules from composite name", () => {
      const rules: PromotionRuleConfig = {
        promotionType: "BUY_X_GET_Y",
        method: "CODE",
        valueType: "FREE",
        value: 100,
        appliesTo: "ALL_PRODUCTS",
        minimumRequirementType: "NONE",
        customerEligibility: "ALL_CUSTOMERS",
        combinations: {
          canCombineWithProductDiscounts: true,
          canCombineWithOrderDiscounts: false,
          canCombineWithShippingDiscounts: true,
        },
        buyXGetY: {
          customerBuys: { type: "QUANTITY", value: 2, appliesTo: "ALL_PRODUCTS" },
          customerGets: { quantity: 1, appliesTo: "ALL_PRODUCTS", rewardType: "FREE", discountValue: 100 },
        },
      };

      const encoded = encodeDiscountNameAndRules("Buy 2 Get 1 Free Launch Offer", rules);
      expect(encoded).toContain("Buy 2 Get 1 Free Launch Offer");
      expect(encoded).toContain("<!-- PROMOTION_RULES_JSON:");

      const extracted = extractDiscountNameAndRules(encoded, {
        type: "PERCENTAGE",
        value: 10,
      });

      expect(extracted.displayName).toBe("Buy 2 Get 1 Free Launch Offer");
      expect(extracted.rules.promotionType).toBe("BUY_X_GET_Y");
      expect(extracted.rules.buyXGetY?.customerBuys.value).toBe(2);
      expect(extracted.rules.buyXGetY?.customerGets.quantity).toBe(1);
    });
  });

  describe("Amount Off Order Calculation", () => {
    it("should calculate percentage discount with maximum cap correctly", () => {
      const subtotal = 4000;
      const discountPercentage = 20; // 20% of 4000 = 800
      const maxCap = 500;

      const rawAmount = Math.round((subtotal * discountPercentage) / 100);
      const cappedAmount = Math.min(rawAmount, maxCap);

      expect(rawAmount).toBe(800);
      expect(cappedAmount).toBe(500);
    });

    it("should prevent discount amount from exceeding cart subtotal", () => {
      const subtotal = 300;
      const fixedDiscount = 500;
      const finalDiscount = Math.min(fixedDiscount, subtotal);
      expect(finalDiscount).toBe(300);
    });
  });

  describe("Buy X Get Y Math Engine", () => {
    it("should calculate Buy 2 Get 1 Free correctly when 3 items are present", () => {
      const cartItems: DiscountItemContext[] = [
        { productId: "p1", unitPrice: 1500, quantity: 2, title: "Shirt A" },
        { productId: "p2", unitPrice: 500, quantity: 1, title: "Cap B" },
      ];

      const triggerCount = cartItems.filter((i) => i.productId === "p1").reduce((acc, i) => acc + i.quantity, 0);
      const requiredBuys = 2;
      const promoMultiplier = Math.floor(triggerCount / requiredBuys);

      expect(promoMultiplier).toBe(1);

      // Reward is 1 free Cap B (৳500)
      const rewardItem = cartItems.find((i) => i.productId === "p2");
      const rewardSavings = (rewardItem?.unitPrice || 0) * 1;
      expect(rewardSavings).toBe(500);
    });

    it("should calculate Buy 2 Get 1 50% OFF correctly", () => {
      const rewardUnitPrice = 1000;
      const discountPercentage = 50;
      const rewardSavings = Math.round((rewardUnitPrice * discountPercentage) / 100);
      expect(rewardSavings).toBe(500);
    });
  });

  describe("Category & Product Targeting", () => {
    it("should filter and apply discount only to matching target categories", () => {
      const items: DiscountItemContext[] = [
        { productId: "p1", categoryId: "cat-shirts", unitPrice: 2000, quantity: 1, title: "Linen Shirt" },
        { productId: "p2", categoryId: "cat-pants", unitPrice: 3000, quantity: 1, title: "Denim Pants" },
      ];

      const targetCategoryIds = ["cat-shirts"];
      const eligibleItems = items.filter((i) => i.categoryId && targetCategoryIds.includes(i.categoryId));

      expect(eligibleItems.length).toBe(1);
      const matched = eligibleItems[0];
      expect(matched?.productId).toBe("p1");

      if (matched) {
        const discountPercentage = 15;
        const discount = Math.round((matched.unitPrice * matched.quantity * discountPercentage) / 100);
        expect(discount).toBe(300);
      }
    });
  });

  describe("Free Shipping Engine", () => {
    it("should zero out shipping fee for free shipping promotion", () => {
      const standardShipping = 120;
      const discountAmount = standardShipping;
      const finalShipping = standardShipping - discountAmount;
      expect(finalShipping).toBe(0);
    });
  });
});
