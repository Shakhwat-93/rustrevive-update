import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/server";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { ReviewStatus } from "@/types/database.types";

export interface SubmitReviewInput {
  productId: string;
  variantId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  title?: string;
  content: string;
}

export class ReviewService {
  /**
   * Submit review with automated verified purchase verification
   */
  public static async submitReview(input: SubmitReviewInput) {
    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5 stars.", { field: "rating" });
    }

    if (!input.content || input.content.trim().length < 10) {
      throw new ValidationError("Review content must be at least 10 characters.", { field: "content" });
    }

    const supabase = createAdminClient();

    // 1. Verify Verified Purchase Status
    let isVerifiedPurchase = false;
    let orderId: string | null = null;

    if (input.customerPhone || input.customerId) {
      let orderQuery = supabase
        .from("orders")
        .select("id, status, order_items(product_id)")
        .in("status", ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);

      if (input.customerId) {
        orderQuery = orderQuery.eq("customer_id", input.customerId);
      } else if (input.customerPhone) {
        const cleanPhone = input.customerPhone.replace(/[^0-9]/g, "");
        orderQuery = orderQuery.ilike("customer_phone", `%${cleanPhone.slice(-8)}%`);
      }

      const { data: matchedOrders } = await orderQuery.limit(10);
      if (matchedOrders && matchedOrders.length > 0) {
        for (const ord of matchedOrders) {
          // @ts-expect-error join type
          const hasItem = ord.order_items?.some((i: { product_id: string }) => i.product_id === input.productId);
          if (hasItem) {
            isVerifiedPurchase = true;
            orderId = ord.id;
            break;
          }
        }
      }
    }

    // 2. Persist Product Review
    const { data: review, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: input.productId,
        variant_id: input.variantId || null,
        customer_id: input.customerId || null,
        customer_name: input.customerName.trim(),
        order_id: orderId,
        rating: Math.floor(input.rating),
        title: input.title?.trim() || null,
        content: input.content.trim(),
        status: "APPROVED", // Auto-approved or PENDING based on config
        is_verified_purchase: isVerifiedPurchase,
      })
      .select()
      .single();

    if (error || !review) {
      logger.error("Failed to insert review", error, "ReviewService");
      throw new Error(`Review submission failed: ${error?.message}`);
    }

    return review;
  }

  /**
   * Get approved reviews & aggregate rating breakdown for a product
   */
  public static async getProductReviews(productId: string) {
    const supabase = createPublicServerClient();

    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch product reviews", error, "ReviewService");
      return { reviews: [], averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const reviewList = reviews || [];
    const totalReviews = reviewList.length;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviewList) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sum += r.rating;
    }

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    return {
      reviews: reviewList,
      averageRating,
      totalReviews,
      distribution,
    };
  }

  /**
   * Admin: List reviews for moderation
   */
  public static async listReviewsForAdmin(status?: ReviewStatus | "ALL") {
    const supabase = createAdminClient();

    let query = supabase
      .from("product_reviews")
      .select("*, products(id, title, slug)")
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list reviews: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Admin: Update review moderation status
   */
  public static async moderateReview(reviewId: string, newStatus: ReviewStatus) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("product_reviews")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError(`Review ${reviewId} not found.`);
    }

    return data;
  }
}
