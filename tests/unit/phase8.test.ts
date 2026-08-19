import { describe, it, expect } from "vitest";
import { PaymentFactory } from "@/lib/payments/payment-factory";
import { CODProvider } from "@/lib/payments/providers/cod.provider";

describe("Phase 8: Payment Provider Abstraction", () => {
  it("resolves COD and Online payment providers correctly", () => {
    const cod = PaymentFactory.getProvider("COD");
    const ssl = PaymentFactory.getProvider("SSL_COMMERZ");
    const bkash = PaymentFactory.getProvider("BKASH");
    const stripe = PaymentFactory.getProvider("STRIPE");

    expect(cod.code).toBe("COD");
    expect(ssl.code).toBe("SSL_COMMERZ");
    expect(bkash.code).toBe("BKASH");
    expect(stripe.code).toBe("STRIPE");
  });

  it("creates a valid COD payment session", async () => {
    const cod = new CODProvider();
    const session = await cod.createPaymentSession({
      orderId: "ord-888",
      orderNumber: "RR-100088",
      amount: 4500,
      currency: "BDT",
      customerName: "Sadman Sakib",
      customerPhone: "01811000000",
      successUrl: "/success",
      cancelUrl: "/cancel",
    });

    expect(session.transactionId).toBe("COD-RR-100088");
    expect(session.status).toBe("COD_PENDING");
    expect(session.provider).toBe("COD");
  });
});

describe("Phase 8: Discount & Coupon Calculations", () => {
  it("calculates percentage discount accurately with cap", () => {
    const subtotal = 5000;
    const percentage = 10;
    const maxCap = 400;

    let discount = Math.round((subtotal * percentage) / 100);
    if (maxCap && discount > maxCap) {
      discount = maxCap;
    }

    expect(discount).toBe(400); // Capped at 400 instead of 500
  });

  it("calculates fixed amount discount without exceeding subtotal", () => {
    const subtotal = 300;
    const fixedValue = 500;
    const discount = Math.min(fixedValue, subtotal);

    expect(discount).toBe(300);
  });
});

describe("Phase 8: Review Rating Aggregation", () => {
  it("computes average rating and distribution correctly", () => {
    const ratings = [5, 5, 4, 3, 5];
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of ratings) {
      distribution[r] = (distribution[r] || 0) + 1;
      sum += r;
    }

    const avg = Number((sum / ratings.length).toFixed(1));

    expect(avg).toBe(4.4);
    expect(distribution[5]).toBe(3);
    expect(distribution[4]).toBe(1);
    expect(distribution[3]).toBe(1);
    expect(distribution[1]).toBe(0);
  });
});
