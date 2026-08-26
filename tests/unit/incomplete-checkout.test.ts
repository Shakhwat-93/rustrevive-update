import { describe, it, expect } from "vitest";

describe("Incomplete / Abandoned Checkout Tracking System", () => {
  it("determines meaningful checkout progress based on contact or address inputs", () => {
    const isMeaningful = (input: { name?: string; phone?: string; email?: string; address?: string; itemsCount: number }) => {
      return Boolean(
        input.name?.trim() ||
        input.phone?.trim() ||
        input.email?.trim() ||
        input.address?.trim() ||
        input.itemsCount > 0
      );
    };

    expect(isMeaningful({ itemsCount: 0 })).toBe(false);
    expect(isMeaningful({ name: "Rahim", itemsCount: 0 })).toBe(true);
    expect(isMeaningful({ phone: "01711223344", itemsCount: 0 })).toBe(true);
    expect(isMeaningful({ address: "Banani, Dhaka", itemsCount: 1 })).toBe(true);
  });

  it("calculates abandonment status based on inactivity duration (> 30 minutes)", () => {
    const checkAbandonment = (lastActivityAt: Date, now: Date = new Date()) => {
      const diffMs = now.getTime() - lastActivityAt.getTime();
      return diffMs > 30 * 60 * 1000 ? "ABANDONED" : "IN_PROGRESS";
    };

    const recentActivity = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
    const oldActivity = new Date(Date.now() - 45 * 60 * 1000); // 45 mins ago

    expect(checkAbandonment(recentActivity)).toBe("IN_PROGRESS");
    expect(checkAbandonment(oldActivity)).toBe("ABANDONED");
  });

  it("calculates checkout recovery rate accurately", () => {
    const calculateRecoveryRate = (converted: number, abandoned: number) => {
      const total = converted + abandoned;
      if (total === 0) return 0;
      return Number(((converted / total) * 100).toFixed(1));
    };

    expect(calculateRecoveryRate(0, 0)).toBe(0);
    expect(calculateRecoveryRate(3, 7)).toBe(30.0);
    expect(calculateRecoveryRate(5, 5)).toBe(50.0);
  });

  it("constructs immutable cart snapshot without mutating live products", () => {
    const cartItems = [
      {
        productId: "p1",
        variantId: "v1",
        title: "Corduroy Overshirt",
        variantTitle: "Rust / L",
        sku: "COS-RST-L",
        price: 3900,
        quantity: 2,
        imageUrl: "/images/corduroy.jpg",
      },
    ];

    const snapshot = cartItems.map((item) => ({
      ...item,
      lineTotal: item.price * item.quantity,
    }));

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.lineTotal).toBe(7800);
    expect(snapshot[0]?.title).toBe("Corduroy Overshirt");
  });
});
