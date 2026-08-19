import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      // Default shortcuts when query is empty
      return successResponse({
        results: [
          { id: "nav-orders", title: "Orders Management", category: "Navigation", subtitle: "View and process customer orders", href: "/admin/orders" },
          { id: "nav-products", title: "Product Catalog", category: "Navigation", subtitle: "Manage garment items and variants", href: "/admin/products" },
          { id: "nav-inventory", title: "Inventory Ledger", category: "Navigation", subtitle: "Monitor stock quantities and adjustments", href: "/admin/inventory" },
          { id: "nav-cms", title: "Homepage CMS Studio", category: "Navigation", subtitle: "Customize hero slides and brand story", href: "/admin/content/homepage" },
          { id: "nav-media", title: "Media Library (Cloudflare R2)", category: "Navigation", subtitle: "Direct CDN media asset manager", href: "/admin/media" },
          { id: "nav-customers", title: "Customer Directory", category: "Navigation", subtitle: "Patron profiles and lifetime spending", href: "/admin/customers" },
          { id: "nav-discounts", title: "Coupons & Discounts", category: "Navigation", subtitle: "Promotional codes and discount rules", href: "/admin/discounts" },
          { id: "nav-shipping", title: "Shipping Methods", category: "Navigation", subtitle: "Configure courier rates and delivery zones", href: "/admin/settings/shipping" },
          { id: "nav-audit", title: "Audit Trail & Logs", category: "Navigation", subtitle: "Staff action history and security events", href: "/admin/settings/audit-logs" },
        ],
      });
    }

    const supabase = createAdminClient();

    // 1. Search Products
    const { data: products } = await supabase
      .from("products")
      .select("id, title, sku, base_price")
      .or(`title.ilike.%${q}%,sku.ilike.%${q}%`)
      .limit(4);

    // 2. Search Orders
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, grand_total, status, customer_name, customer_email, customer_phone")
      .or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`)
      .limit(4);

    // 3. Search Customers
    const { data: customers } = await supabase
      .from("profiles")
      .select("id, display_name, first_name, last_name, email")
      .or(`display_name.ilike.%${q}%,email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(4);

    interface SearchResultItem {
      id: string;
      title: string;
      category: "Products" | "Orders" | "Customers" | "Navigation";
      subtitle: string;
      href: string;
    }

    const results: SearchResultItem[] = [];

    // Map Products
    (products || []).forEach((p) => {
      results.push({
        id: `prod-${p.id}`,
        title: p.title,
        category: "Products",
        subtitle: `SKU: ${p.sku} • ৳${p.base_price.toLocaleString()}`,
        href: `/admin/products`,
      });
    });

    // Map Orders
    (orders || []).forEach((o) => {
      const cust = o.customer_name || o.customer_email || "Customer";
      results.push({
        id: `ord-${o.id}`,
        title: `Order #${o.order_number}`,
        category: "Orders",
        subtitle: `${cust} • ৳${(o.grand_total || 0).toLocaleString()} • ${o.status}`,
        href: `/admin/orders/${o.id}`,
      });
    });

    // Map Customers
    (customers || []).forEach((c) => {
      const name = c.display_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Patron";
      results.push({
        id: `cust-${c.id}`,
        title: name,
        category: "Customers",
        subtitle: c.email || "No email",
        href: `/admin/customers`,
      });
    });

    return successResponse({ results });
  } catch (err: unknown) {
    return errorResponse(err, "AdminSearchGET");
  }
}
