import { randomUUID } from "crypto";
import type { StorageNamespace } from "@/types/storage.types";

/**
 * Sanitizes a filename, stripping directory traversal, invalid characters, and multiple consecutive separators
 */
export function sanitizeFilename(filename: string): string {
  // Extract base name, remove path components
  const baseName = filename.replace(/^.*[\\/]/, "");
  
  // Replace whitespace and special characters with hyphens
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/[_-]+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");

  return sanitized || "asset";
}

/**
 * Generates an immutable, collision-free storage key for Cloudflare R2
 * Pattern: {namespace}/{year}/{month}/{uuid}_{sanitizedFilename}
 */
export function generateStorageKey(
  namespace: StorageNamespace,
  originalFilename: string
): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = randomUUID();
  const sanitized = sanitizeFilename(originalFilename);

  return `${namespace}/${year}/${month}/${uuid}_${sanitized}`;
}
