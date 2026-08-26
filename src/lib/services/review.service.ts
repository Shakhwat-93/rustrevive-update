import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/server";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import { NotificationService } from "@/lib/services/notification.service";
import { logger } from "@/lib/logging/logger";
import type { ReviewStatus } from "@/types/database.types";

export interface SubmitReviewInput {
  productId: string;
  variantId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  content: string;
}

export interface ReviewListFilter {
  status?: ReviewStatus | "ALL";
  rating?: number;
  search?: string;
  limit?: number;
  page?: number;
}

export class ReviewService {
  /**
   * Submit review from product page.
   * Review ALWAYS enters database with status = "PENDING" awaiting admin moderation.
   */
  public static async submitReview(input: SubmitReviewInput) {
    if (!input.productId) {
      throw new ValidationError("Product ID is required.", { field: "productId" });
    }

    if (!input.customerName || input.customerName.trim().length < 2) {
      throw new ValidationError("Please provide a valid customer name (at least 2 characters).", {
        field: "customerName",
      });
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5 stars.", { field: "rating" });
    }

    if (!input.content || input.content.trim().length < 5) {
      throw new ValidationError("Review details must be at least 5 characters.", { field: "content" });
    }

    const supabase = createAdminClient();

    // 1. Verify Product Exists
    const { data: product, error: prodError } = await supabase
      .from("products")
      .select("id, title")
      .eq("id", input.productId)
      .single();

    if (prodError || !product) {
      throw new NotFoundError("The specified product was not found.");
    }

    // 2. Duplicate Review Protection (Prevent spam for same customer/phone on this product)
    if (input.customerId || input.customerPhone) {
      let dupQuery = supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", input.productId);

      if (input.customerId) {
        dupQuery = dupQuery.eq("customer_id", input.customerId);
      } else if (input.customerPhone) {
        const cleanPhone = input.customerPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.length >= 7) {
          dupQuery = dupQuery.ilike("customer_name", `%${input.customerName.trim()}%`);
        }
      }

      const { data: existingReviews } = await dupQuery.limit(1);
      if (existingReviews && existingReviews.length > 0) {
        throw new ValidationError("You have already submitted a review for this garment.", {
          field: "duplicate",
        });
      }
    }

    // 3. Verify Verified Purchase Status from Real Orders Table
    let isVerifiedPurchase = false;
    let orderId: string | null = null;

    if (input.customerPhone || input.customerId || input.customerEmail) {
      let orderQuery = supabase
        .from("orders")
        .select("id, status, customer_email, customer_phone, order_items(product_id)")
        .in("status", ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);

      if (input.customerId) {
        orderQuery = orderQuery.eq("customer_id", input.customerId);
      } else if (input.customerPhone) {
        const cleanPhone = input.customerPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.length >= 7) {
          orderQuery = orderQuery.ilike("customer_phone", `%${cleanPhone.slice(-8)}%`);
        }
      } else if (input.customerEmail) {
        orderQuery = orderQuery.eq("customer_email", input.customerEmail.trim().toLowerCase());
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

    // 4. Persist Product Review strictly with status = "PENDING"
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
        status: "PENDING", // Strictly PENDING until admin approves
        is_verified_purchase: isVerifiedPurchase,
      })
      .select()
      .single();

    if (error || !review) {
      logger.error("Failed to insert review", error, "ReviewService");
      throw new Error(`Review submission failed: ${error?.message}`);
    }

    logger.info("New review submitted for moderation", "ReviewService", {
      reviewId: review.id,
      productId: input.productId,
      rating: input.rating,
      isVerifiedPurchase,
    });

    // Trigger Admin Notification for New Review
    NotificationService.createNotification({
      type: "NEW_REVIEW",
      title: "New Review Awaiting Moderation",
      message: `${input.rating}★ Review by ${input.customerName}: "${input.title || input.content.slice(0, 50)}..."`,
      resourceType: "reviews",
      resourceId: review.id,
      customerName: input.customerName,
    }).catch((err) => {
      logger.warn("Failed to dispatch review notification", "ReviewService", { error: err });
    });

    return review;
  }

  /**
   * Get approved reviews & aggregate rating breakdown for a product.
   * Strictly filters for status = 'APPROVED'.
   */
  public static async getProductReviews(
    productId: string,
    sort: "newest" | "highest" | "lowest" = "newest"
  ) {
    const supabase = createPublicServerClient();

    let query = supabase
      .from("product_reviews")
      .select("id, customer_name, rating, title, content, is_verified_purchase, created_at, variant_id")
      .eq("product_id", productId)
      .eq("status", "APPROVED");

    if (sort === "highest") {
      query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "lowest") {
      query = query.order("rating", { ascending: true }).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: reviews, error } = await query;

    if (error) {
      logger.error("Failed to fetch product reviews", error, "ReviewService");
      return {
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        distributionPercent: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const reviewList = reviews || [];
    const totalReviews = reviewList.length;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviewList) {
      const star = Math.max(1, Math.min(5, Math.floor(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
      sum += r.rating;
    }

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    const distributionPercent: Record<number, number> = {
      1: totalReviews > 0 ? Math.round(((distribution[1] ?? 0) / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round(((distribution[2] ?? 0) / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round(((distribution[3] ?? 0) / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round(((distribution[4] ?? 0) / totalReviews) * 100) : 0,
      5: totalReviews > 0 ? Math.round(((distribution[5] ?? 0) / totalReviews) * 100) : 0,
    };

    return {
      reviews: reviewList,
      averageRating,
      totalReviews,
      distribution,
      distributionPercent,
    };
  }

  /**
   * Admin: List reviews for moderation with status counts and search filters.
   */
  public static async listReviewsForAdmin(filter: ReviewListFilter = {}) {
    const supabase = createAdminClient();

    // 1. Fetch Status Counts across entire table
    const { data: allRows } = await supabase
      .from("product_reviews")
      .select("status, rating");

    const counts = {
      all: allRows?.length || 0,
      pending: allRows?.filter((r) => r.status === "PENDING").length || 0,
      approved: allRows?.filter((r) => r.status === "APPROVED").length || 0,
      rejected: allRows?.filter((r) => r.status === "REJECTED").length || 0,
    };

    // 2. Build filtered query
    let query = supabase
      .from("product_reviews")
      .select(`
        id,
        product_id,
        variant_id,
        customer_id,
        customer_name,
        order_id,
        rating,
        title,
        content,
        status,
        is_verified_purchase,
        created_at,
        updated_at,
        products (
          id,
          title,
          slug,
          sku,
          base_price,
          product_media (
            is_primary,
            media (
              public_url
            )
          )
        ),
        orders (
          id,
          order_number,
          grand_total
        )
      `)
      .order("created_at", { ascending: false });

    if (filter.status && filter.status !== "ALL") {
      query = query.eq("status", filter.status);
    }

    if (filter.rating && filter.rating >= 1 && filter.rating <= 5) {
      query = query.eq("rating", filter.rating);
    }

    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      query = query.or(
        `customer_name.ilike.%${term}%,title.ilike.%${term}%,content.ilike.%${term}%`
      );
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const { data: reviews, error } = await query;

    if (error) {
      logger.error("Failed to list reviews for admin", error, "ReviewService");
      throw new Error(`Failed to list reviews: ${error.message}`);
    }

    return {
      reviews: reviews || [],
      counts,
    };
  }

  /**
   * Admin: Update review moderation status ("APPROVED" | "REJECTED" | "PENDING").
   */
  public static async moderateReview(reviewId: string, newStatus: ReviewStatus) {
    if (!["PENDING", "APPROVED", "REJECTED"].includes(newStatus)) {
      throw new ValidationError("Invalid moderation status.", { field: "status" });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("product_reviews")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select(`
        id,
        product_id,
        customer_name,
        rating,
        status,
        products (
          title
        )
      `)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Review with ID "${reviewId}" not found.`);
    }

    logger.info(`Review ${reviewId} status updated to ${newStatus}`, "ReviewService", { reviewId, newStatus });

    return data;
  }

  /**
   * Admin: Permanently delete review row from database.
   */
  public static async deleteReview(reviewId: string) {
    if (!reviewId) {
      throw new ValidationError("Review ID is required for deletion.", { field: "reviewId" });
    }

    const supabase = createAdminClient();

    const { data: existing, error: findError } = await supabase
      .from("product_reviews")
      .select("id, product_id, customer_name")
      .eq("id", reviewId)
      .single();

    if (findError || !existing) {
      throw new NotFoundError(`Review with ID "${reviewId}" not found.`);
    }

    const { error: deleteError } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      logger.error(`Failed to permanently delete review ${reviewId}`, deleteError, "ReviewService");
      throw new Error(`Failed to delete review: ${deleteError.message}`);
    }

    logger.info(`Review ${reviewId} permanently deleted from database.`, "ReviewService", {
      reviewId,
      productId: existing.product_id,
    });

    return { success: true, deletedId: reviewId };
  }
}
