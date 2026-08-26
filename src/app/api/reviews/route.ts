import { NextRequest } from "next/server";
import { ReviewService } from "@/lib/services/review.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const sort = (searchParams.get("sort") || "newest") as "newest" | "highest" | "lowest";

    if (!productId) {
      throw new ValidationError("productId is required", { field: "productId" });
    }

    const reviews = await ReviewService.getProductReviews(productId, sort);
    return successResponse(reviews);
  } catch (err: unknown) {
    return errorResponse(err, "ProductReviewsGET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      variantId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      rating,
      title,
      content,
    } = body;

    if (!productId || !customerName || !rating || !content) {
      throw new ValidationError("Missing required review fields.", {
        fields: ["productId", "customerName", "rating", "content"],
      });
    }

    const review = await ReviewService.submitReview({
      productId,
      variantId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      rating: Number(rating),
      title,
      content,
    });

    return successResponse(
      {
        review,
        message: "Your review has been submitted and is awaiting approval.",
      },
      201
    );
  } catch (err: unknown) {
    return errorResponse(err, "SubmitReviewPOST");
  }
}
