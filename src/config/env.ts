import { z } from "zod";

/**
 * Client-Side Environment Schema (Exposed to browser via NEXT_PUBLIC_)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, { message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required" }),
  NEXT_PUBLIC_MEDIA_URL: z.string().url().default("https://media.rustrevive.store"),
});

/**
 * Server-Only Environment Schema (STRICTLY FORBIDDEN FROM CLIENT BUNDLE)
 */
const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  
  // Supabase Privileged Credentials
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, { message: "SUPABASE_SERVICE_ROLE_KEY is required" }),
  
  // Cloudflare R2 Credentials
  R2_ACCOUNT_ID: z.string().min(1, { message: "R2_ACCOUNT_ID is required" }),
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().optional().default("r2-access-key-placeholder"),
  R2_SECRET_ACCESS_KEY: z.string().optional().default("r2-secret-key-placeholder"),
  R2_BUCKET_NAME: z.string().min(1, { message: "R2_BUCKET_NAME is required" }).default("rustandrevive"),
  R2_ENDPOINT: z.string().url().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let validatedServerEnv: ServerEnv | null = null;
let validatedClientEnv: ClientEnv | null = null;

/**
 * Validates and returns server environment variables.
 * Fails fast with clear descriptive error messages if required variables are missing.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: getServerEnv() called in browser context.");
  }

  if (validatedServerEnv) {
    return validatedServerEnv;
  }

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    
    const errorMessage = `CRITICAL CONFIGURATION ERROR: Invalid environment variables:\n${errorDetails}`;
    
    if (process.env["NODE_ENV"] === "test") {
      throw new Error(errorMessage);
    }
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  validatedServerEnv = result.data;
  return validatedServerEnv;
}

/**
 * Validates and returns client-safe environment variables.
 */
export function getClientEnv(): ClientEnv {
  if (validatedClientEnv) {
    return validatedClientEnv;
  }

  const clientVars = {
    NEXT_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_SITE_URL"],
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    NEXT_PUBLIC_MEDIA_URL: process.env["NEXT_PUBLIC_MEDIA_URL"],
  };

  const result = clientEnvSchema.safeParse(clientVars);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    
    const errorMessage = `CRITICAL CONFIGURATION ERROR: Invalid client environment variables:\n${errorDetails}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  validatedClientEnv = result.data;
  return validatedClientEnv;
}
