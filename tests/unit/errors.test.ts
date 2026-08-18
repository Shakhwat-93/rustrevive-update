import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  StorageError,
  DatabaseError,
} from "@/lib/errors/app-error";

describe("AppError Hierarchy", () => {
  it("should create AppError with standard defaults", () => {
    const error = new AppError("Base error", 500, "BASE_ERROR");
    expect(error.message).toBe("Base error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("BASE_ERROR");
    expect(error.isOperational).toBe(true);
  });

  it("should configure ValidationError with 400 status code", () => {
    const error = new ValidationError("Invalid SKU format", { field: "sku" });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ field: "sku" });
  });

  it("should configure AuthenticationError with 401 status code", () => {
    const error = new AuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHENTICATED");
  });

  it("should configure ForbiddenError with 403 status code", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("should configure NotFoundError with 404 status code", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("should configure StorageError and DatabaseError with 500 status codes", () => {
    const storageErr = new StorageError("Upload timeout");
    const dbErr = new DatabaseError("Query failed");

    expect(storageErr.statusCode).toBe(500);
    expect(storageErr.code).toBe("STORAGE_ERROR");

    expect(dbErr.statusCode).toBe(500);
    expect(dbErr.code).toBe("DATABASE_ERROR");
  });
});
