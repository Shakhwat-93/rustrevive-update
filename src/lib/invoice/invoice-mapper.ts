import type { InvoiceData, InvoiceItemData } from "@/types/invoice.types";

interface RawAddressSnapshot {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  area?: string;
  postalCode?: string;
  country?: string;
}

interface RawOrderItem {
  id: string;
  product_title_snapshot: string;
  variant_title_snapshot?: string | null;
  sku_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface RawOrder {
  id: string;
  order_number?: string | null;
  created_at: string;
  status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  subtotal?: number | null;
  discount_total?: number | null;
  shipping_total?: number | null;
  tax_total?: number | null;
  grand_total?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_notes?: string | null;
  notes?: string | null;
  shipping_address_snapshot?: unknown;
  billing_address_snapshot?: unknown;
  order_items?: RawOrderItem[];
  [key: string]: unknown;
}

/**
 * Single trusted calculation and normalization mapper for invoices and receipts
 */
export function mapOrderToInvoiceData(order: RawOrder): InvoiceData {
  const addr = (order.shipping_address_snapshot || {}) as RawAddressSnapshot;

  const createdAt = new Date(order.created_at);
  const isValidDate = !Number.isNaN(createdAt.getTime());

  const dateFormatted = isValidDate
    ? createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const timeFormatted = isValidDate
    ? createdAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const createdDateFormatted = isValidDate
    ? `${dateFormatted} ${timeFormatted}`
    : "";

  // Robust resolution for order number
  const orderNumber =
    order.order_number ||
    (order.orderNumber as string) ||
    (order.id ? `ORD-${order.id.slice(0, 8).toUpperCase()}` : "ORD-UNKNOWN");

  // Robust customer extraction
  const rawAny = order;
  const rawCustomer = (rawAny.customer || {}) as Record<string, unknown>;
  const customerName =
    addr.fullName ||
    order.customer_name ||
    (rawCustomer.full_name as string) ||
    (rawCustomer.name as string) ||
    "Valued Customer";

  const customerPhone =
    addr.phone ||
    order.customer_phone ||
    (rawCustomer.phone as string) ||
    "N/A";

  const customerEmail =
    order.customer_email ||
    (rawCustomer.email as string) ||
    null;

  // Build clean composite address
  const street = addr.addressLine1 || (rawAny.shipping_address as Record<string, unknown>)?.street_address as string;
  const city = addr.city || (rawAny.shipping_address as Record<string, unknown>)?.city as string;
  const postal = addr.postalCode || (rawAny.shipping_address as Record<string, unknown>)?.postal_code as string;

  const addressParts = [
    street,
    addr.addressLine2,
    addr.area,
    city,
    postal ? `Postal: ${postal}` : undefined,
    addr.country || "Bangladesh",
  ].filter(Boolean);

  const fullAddress = addressParts.join(", ");

  const rawItems = order.order_items || (rawAny.items as RawOrderItem[]) || [];
  const items: InvoiceItemData[] = rawItems.map((item: any) => ({
    id: item.id || Math.random().toString(),
    title: item.product_title_snapshot || item.product_name || item.title || "Untitled Item",
    variant: item.variant_title_snapshot || item.variant_name || item.variant || null,
    sku: item.sku_snapshot || item.sku || "N/A",
    unitPrice: Number(item.unit_price ?? item.price ?? item.unitPrice) || 0,
    quantity: Number(item.quantity ?? item.qty) || 1,
    lineTotal: Number(item.line_total ?? item.total_price ?? item.total) || 0,
  }));

  const paymentMethodLabel =
    order.payment_method === "CASH_ON_DELIVERY"
      ? "Cash on Delivery (COD)"
      : order.payment_method || "Cash on Delivery";

  const subtotal = Number(order.subtotal ?? rawAny.sub_total) || 0;
  const discountTotal = Number(order.discount_total ?? rawAny.discount_amount ?? rawAny.discount) || 0;
  const shippingTotal = Number(order.shipping_total ?? rawAny.shipping_fee ?? rawAny.shipping) || 0;
  const grandTotal = Number(order.grand_total ?? rawAny.total_amount ?? rawAny.total) || 0;

  return {
    orderId: order.id,
    orderNumber,
    date: dateFormatted,
    time: timeFormatted,
    createdDateFormatted,
    brandName: "RUST & REVIVE",
    tagline: "Refined Heritage & Artisanal Essentials",
    storeAddress: "Dhaka, Bangladesh",
    storeEmail: "care@rustrevive.store",
    storePhone: "+880 1800-000000",
    storeWebsite: "www.rustrevive.store",
    customer: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      addressLine1: street || "",
      addressLine2: addr.addressLine2 || null,
      city: city || "Dhaka",
      area: addr.area || null,
      postalCode: postal || null,
      fullAddress: fullAddress || "Dhaka, Bangladesh",
    },
    items,
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal: Number(order.tax_total) || 0,
    grandTotal,
    paymentMethod: paymentMethodLabel,
    paymentStatus: order.payment_status || "PENDING",
    orderStatus: order.status || "CONFIRMED",
    customerNotes: order.customer_notes || order.notes || (rawAny.customer_notes as string) || null,
    thankYouMessage:
      "Thank you for choosing Rust & Revive. Crafted with uncompromising attention to detail.",
  };
}
