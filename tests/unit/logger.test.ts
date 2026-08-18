import { describe, it, expect } from "vitest";
import { sanitizeLogData } from "@/lib/logging/logger";

describe("Logger Secret Sanitization", () => {
  it("should redact sensitive fields such as password, token, and secret", () => {
    const rawPayload = {
      email: "customer@example.com",
      password: "SuperSecretPassword123!",
      apiKey: "secret-api-key-value",
      nested: {
        accessToken: "jwt.header.payload.signature",
        r2_secret_access_key: "r2_super_secret",
        normalField: "public-data",
      },
    };

    const sanitized = sanitizeLogData(rawPayload) as typeof rawPayload;

    expect(sanitized.email).toBe("customer@example.com");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.apiKey).toBe("[REDACTED]");
    expect(sanitized.nested.accessToken).toBe("[REDACTED]");
    expect(sanitized.nested.r2_secret_access_key).toBe("[REDACTED]");
    expect(sanitized.nested.normalField).toBe("public-data");
  });

  it("should handle arrays and primitive values cleanly", () => {
    expect(sanitizeLogData("simple-string")).toBe("simple-string");
    expect(sanitizeLogData(12345)).toBe(12345);
    expect(sanitizeLogData(null)).toBe(null);

    const arrayData = [{ password: "123" }, { user: "john" }];
    const sanitizedArray = sanitizeLogData(arrayData) as typeof arrayData;
    expect(sanitizedArray[0]?.password).toBe("[REDACTED]");
    expect(sanitizedArray[1]?.user).toBe("john");
  });
});
