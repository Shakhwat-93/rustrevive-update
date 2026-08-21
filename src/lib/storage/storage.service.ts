import "server-only";
import { getServerEnv } from "@/config/env";
import type { IStorageService } from "@/lib/storage/storage.interface";
import { R2StorageProvider } from "@/lib/storage/r2-storage.provider";

let storageServiceInstance: IStorageService | null = null;

/**
 * Returns the configured storage service instance.
 * Lazily initialized to allow test environment mocking.
 */
export function getStorageService(): IStorageService {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  const env = getServerEnv();

  storageServiceInstance = new R2StorageProvider({
    accountId: env.R2_ACCOUNT_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    publicMediaUrl: env.NEXT_PUBLIC_MEDIA_URL,
    endpoint: env.R2_ENDPOINT,
  });

  return storageServiceInstance;
}

/**
 * Test helper to inject mock storage providers
 */
export function setStorageServiceForTesting(mockService: IStorageService | null): void {
  storageServiceInstance = mockService;
}
