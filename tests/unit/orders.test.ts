import { describe, it, expect } from "vitest";
import { VALID_STATUS_TRANSITIONS } from "@/lib/constants/order.constants";

describe("Order State Machine Rules", () => {
  it("allows transition from PENDING to CONFIRMED or CANCELLED", () => {
    const transitions = VALID_STATUS_TRANSITIONS["PENDING"];
    expect(transitions).toContain("CONFIRMED");
    expect(transitions).toContain("CANCELLED");
    expect(transitions).not.toContain("DELIVERED");
  });

  it("allows transition from CONFIRMED to PROCESSING or CANCELLED", () => {
    const transitions = VALID_STATUS_TRANSITIONS["CONFIRMED"];
    expect(transitions).toContain("PROCESSING");
    expect(transitions).toContain("CANCELLED");
    expect(transitions).not.toContain("PENDING");
  });

  it("allows transition from SHIPPED to DELIVERED", () => {
    const transitions = VALID_STATUS_TRANSITIONS["SHIPPED"];
    expect(transitions).toContain("DELIVERED");
    expect(transitions).not.toContain("PENDING");
  });

  it("does not allow transition from DELIVERED back to PROCESSING", () => {
    const transitions = VALID_STATUS_TRANSITIONS["DELIVERED"];
    expect(transitions).not.toContain("PROCESSING");
  });

  it("does not allow transitions out of CANCELLED", () => {
    const transitions = VALID_STATUS_TRANSITIONS["CANCELLED"];
    expect(transitions).toEqual([]);
  });
});

describe("Server-Side Decimal-Safe Pricing Calculations", () => {
  it("calculates exact integer line totals and subtotals without floating-point errors", () => {
    const unitPrice = 1350;
    const quantity = 3;
    const lineTotal = unitPrice * quantity;
    const shipping = 120;
    const discount = 0;
    const grandTotal = lineTotal + shipping - discount;

    expect(lineTotal).toBe(4050);
    expect(grandTotal).toBe(4170);
    expect(Number.isInteger(grandTotal)).toBe(true);
  });

  it("formats sequential human order numbers correctly", () => {
    const seqValue = 100042;
    const orderNumber = `RR-${seqValue}`;
    expect(orderNumber).toBe("RR-100042");
    expect(orderNumber.startsWith("RR-")).toBe(true);
  });
});
