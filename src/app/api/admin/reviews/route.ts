import { NextRequest } from "next/server";
import { ReviewService } from "@/lib/services/review.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import type { ReviewStatus } from "@/types/database.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "ALL") as ReviewStatus | "ALL";

    const reviews = await ReviewService.listReviewsForAdmin(status);
    return successResponse(reviews);
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
