import { describe, it, expect } from "vitest";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

describe("API Response Utilities", () => {
  it("should create standard success responses", async () => {
    const data = { id: "prod_123", title: "Vintage Pants" };
    const response = successResponse(data, 201);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.meta?.timestamp).toBeDefined();
  });

  it("should map operational errors to appropriate status codes", async () => {
    const error = new ValidationError("SKU already exists", { field: "sku" });
    const response = errorResponse(error, "ProductService");

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBe("SKU already exists");
    expect(json.error.details).toEqual({ field: "sku" });
  });
});
