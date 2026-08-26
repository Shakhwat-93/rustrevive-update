import { NextRequest } from "next/server";
import { ReviewService } from "@/lib/services/review.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import type { ReviewStatus } from "@/types/database.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "ALL") as ReviewStatus | "ALL";
    const ratingParam = searchParams.get("rating");
    const rating = ratingParam ? Number(ratingParam) : undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const data = await ReviewService.listReviewsForAdmin({
      status,
      rating,
      search,
      limit,
    });

    return successResponse(data);
  } catch (err: unknown) {
    return errorResponse(err, "AdminReviewsGET");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId, status } = body;

    if (!reviewId || !status) {
      throw new ValidationError("reviewId and status are required.", { fields: ["reviewId", "status"] });
    }

    const review = await ReviewService.moderateReview(reviewId, status);
    return successResponse(review);
  } catch (err: unknown) {
    return errorResponse(err, "AdminReviewsPATCH");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      throw new ValidationError("Review ID (id) query parameter is required for deletion.", {
        field: "id",
      });
    }

    const result = await ReviewService.deleteReview(reviewId);
    return successResponse(result);
  } catch (err: unknown) {
    return errorResponse(err, "AdminReviewsDELETE");
  }
}
