export type InvoiceFormat = "a4" | "58mm" | "80mm";

export interface InvoiceItemData {
  id: string;
  title: string;
  variant: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface InvoiceData {
  orderId: string;
  orderNumber: string;
  date: string;
  time: string;
  createdDateFormatted: string;
  brandName: string;
  tagline: string;
  storeAddress: string;
  storeEmail: string;
  storePhone?: string | null;
  storeWebsite: string;
  customer: {
    name: string;
    phone: string;
    email?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    area?: string | null;
    postalCode?: string | null;
    fullAddress: string;
  };
  items: InvoiceItemData[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  customerNotes?: string | null;
  thankYouMessage: string;
}
