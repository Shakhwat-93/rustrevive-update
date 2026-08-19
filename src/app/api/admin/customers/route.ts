import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const supabase = createAdminClient();

    // 1. Fetch Registered Profiles
    let profilesQuery = supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name, email, phone, avatar_url, created_at, is_active")
      .order("created_at", { ascending: false });

    if (query) {
      profilesQuery = profilesQuery.or(`display_name.ilike.%${query}%,email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    }

    const { data: profiles, error: profilesErr } = await profilesQuery;
    if (profilesErr) throw profilesErr;

    // 2. Fetch all orders to compute lifetime value, order counts, and last order date
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id, customer_id, customer_name, customer_email, customer_phone, grand_total, status, created_at, shipping_address_snapshot");

    if (ordersErr) throw ordersErr;

    const allOrders = orders || [];

    // Map profiles to customer rows
    const customerList = (profiles || []).map((p) => {
      const userOrders = allOrders.filter(
        (o) => o.customer_id === p.id || (p.email && o.customer_email === p.email)
      );

      const validUserOrders = userOrders.filter((o) => o.status !== "CANCELLED");
      const totalSpent = validUserOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
      const ordersCount = userOrders.length;

      // Determine last order relative date
      let lastOrder = "No orders yet";
      if (userOrders.length > 0) {
        const sorted = [...userOrders].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastDate = new Date(sorted[0]?.created_at || "");
        const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) lastOrder = "Today";
        else if (diffDays === 1) lastOrder = "Yesterday";
        else if (diffDays < 7) lastOrder = `${diffDays} days ago`;
        else if (diffDays < 30) lastOrder = `${Math.floor(diffDays / 7)} weeks ago`;
        else lastOrder = lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }

      // Location from last order shipping address snapshot
      let location = "Dhaka";
      if (userOrders.length > 0 && userOrders[0]?.shipping_address_snapshot) {
        const addr = userOrders[0].shipping_address_snapshot as Record<string, unknown>;
        location = (addr.city as string) || (addr.district as string) || "Dhaka";
      }

      const fullName = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email?.split("@")[0] || "Patron";

      return {
        id: p.id,
        name: fullName,
        email: p.email || "No email",
        phone: p.phone || null,
        location,
        ordersCount,
        totalSpent,
        lastOrder,
        createdAt: p.created_at,
      };
    });

    return successResponse({ customers: customerList, totalCount: customerList.length });
  } catch (err: unknown) {
    return errorResponse(err, "AdminCustomersGET");
  }
}
