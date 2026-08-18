import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getClientEnv, getServerEnv } from "@/config/env";

describe("Environment Validation Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should validate and return client environment variables when valid", () => {
    process.env["NEXT_PUBLIC_SITE_URL"] = "https://rustrevive.store";
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "valid-anon-key";
    process.env["NEXT_PUBLIC_MEDIA_URL"] = "https://media.rustrevive.store";

    const clientEnv = getClientEnv();
    expect(clientEnv.NEXT_PUBLIC_SITE_URL).toBe("https://rustrevive.store");
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("valid-anon-key");
    expect(clientEnv.NEXT_PUBLIC_MEDIA_URL).toBe("https://media.rustrevive.store");
  });

  it("should validate and return server environment variables when valid", () => {
    process.env["NEXT_PUBLIC_SITE_URL"] = "https://rustrevive.store";
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "valid-anon-key";
    process.env["NEXT_PUBLIC_MEDIA_URL"] = "https://media.rustrevive.store";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "valid-service-role-key";
    process.env["R2_ACCOUNT_ID"] = "account-123";
    process.env["R2_ACCESS_KEY_ID"] = "access-key-123";
    process.env["R2_SECRET_ACCESS_KEY"] = "secret-key-123";
    process.env["R2_BUCKET_NAME"] = "rustrevive-media-prod";

    const serverEnv = getServerEnv();
    expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("valid-service-role-key");
    expect(serverEnv.R2_ACCOUNT_ID).toBe("account-123");
    expect(serverEnv.R2_BUCKET_NAME).toBe("rustrevive-media-prod");
  });
});
