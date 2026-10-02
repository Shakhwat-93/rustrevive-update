import { describe, it, expect } from "vitest";
import { mapOrderToInvoiceData } from "@/lib/invoice/invoice-mapper";

describe("Invoice Mapper Data Integrity", () => {
  it("accurately transforms order data with multiple variants and financial totals", () => {
    const mockOrder = {
      id: "ord-123456",
      order_number: "RR-100234",
      created_at: "2026-10-02T14:30:00Z",
      status: "CONFIRMED",
      payment_method: "CASH_ON_DELIVERY",
      payment_status: "PENDING",
      subtotal: 2500,
      shipping_fee: 100,
      discount_amount: 200,
      total_amount: 2400,
      customer_notes: "Please call before delivery",
      customer: {
        id: "cust-1",
        full_name: "Tanvir Rahman",
        phone: "+8801712345678",
        email: "tanvir@example.com",
      },
      shipping_address: {
        full_name: "Tanvir Rahman",
        phone: "+8801712345678",
        street_address: "Flat 4B, Road 12, Banani",
        city: "Dhaka",
        postal_code: "1213",
      },
      items: [
        {
          id: "item-1",
          product_name: "Minimalist Leather Cardholder",
          variant_name: "Vintage Brown / Slim",
          unit_price: 1000,
          quantity: 2,
          total_price: 2000,
        },
        {
          id: "item-2",
          product_name: "Key Organizer Clip",
          unit_price: 500,
          quantity: 1,
          total_price: 500,
        },
      ],
    };

    const invoice = mapOrderToInvoiceData(mockOrder);

    expect(invoice.orderNumber).toBe("RR-100234");
    expect(invoice.customer.name).toBe("Tanvir Rahman");
    expect(invoice.customer.phone).toBe("+8801712345678");
    expect(invoice.customer.fullAddress).toContain("Banani");
    expect(invoice.items.length).toBe(2);
    expect(invoice.items[0]?.variant).toBe("Vintage Brown / Slim");
    expect(invoice.subtotal).toBe(2500);
    expect(invoice.shippingTotal).toBe(100);
    expect(invoice.discountTotal).toBe(200);
    expect(invoice.grandTotal).toBe(2400);
    expect(invoice.paymentMethod).toBe("Cash on Delivery (COD)");
    expect(invoice.customerNotes).toBe("Please call before delivery");
  });

  it("handles fallback and missing address fields cleanly without undefined or nulls", () => {
    const minimalOrder = {
      id: "ord-minimal",
      created_at: new Date().toISOString(),
      items: [],
    };

    const invoice = mapOrderToInvoiceData(minimalOrder as any);

    expect(invoice.orderNumber).toBe("ORD-ORD-MINI");
    expect(invoice.customer.name).toBe("Valued Customer");
    expect(invoice.customer.phone).toBe("N/A");
    expect(invoice.customer.fullAddress).toBe("Bangladesh");
    expect(invoice.grandTotal).toBe(0);
    expect(invoice.items).toEqual([]);
  });
});
