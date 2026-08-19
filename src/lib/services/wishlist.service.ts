import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export class WishlistService {
  /**
   * Toggle item in authenticated customer's wishlist
   */
  public static async toggleWishlistItem(customerId: string, productId: string) {
    const supabase = createAdminClient();

    // Check if exists
    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("customer_id", customerId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      await supabase.from("wishlist_items").delete().eq("id", existing.id);
      return { added: false, productId };
    } else {
      await supabase.from("wishlist_items").insert({
        customer_id: customerId,
        product_id: productId,
      });
      return { added: true, productId };
    }
  }

  /**
   * Get wishlist items for customer with product details
   */
  public static async getCustomerWishlist(customerId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("wishlist_items")
      .select(`
        id,
        created_at,
        products(
          id,
          title,
          slug,
          base_price,
          compare_at_price,
          status,
          is_active,
          product_media(is_primary, media(public_url))
        )
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to query customer wishlist", error, "WishlistService");
      return [];
    }

    return data || [];
  }
}
