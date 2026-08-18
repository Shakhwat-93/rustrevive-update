import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { ApiResponse } from "@/types/common.types";

/**
 * Standardized Success Response Helper
 */
export function successResponse<T>(data: T, status = 200, meta?: ApiResponse["meta"]): NextResponse<ApiResponse<T>> {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Standardized Error Response Helper
 * Automatically maps AppError status codes and redacts internal errors in production
 */
export function errorResponse(error: unknown, context?: string): NextResponse<ApiResponse<null>> {
  const isProduction = process.env["NODE_ENV"] === "production";
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred. Please try again.";
  let details: Record<string, unknown> | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
    logger.warn(`Operational Error: ${message}`, context, { code, statusCode, details });
  } else if (error instanceof Error) {
    logger.error(`Unhandled Error: ${error.message}`, error, context);
    if (!isProduction) {
      message = error.message;
    }
  } else {
    logger.error("Unknown Non-Error Object Caught", error, context);
  }

  const body: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(body, { status: statusCode });
}
