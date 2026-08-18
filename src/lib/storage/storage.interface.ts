import type {
  UploadFileOptions,
  StoredAsset,
  PresignedUploadUrlResult,
  StorageObjectMetadata,
} from "@/types/storage.types";

/**
 * Storage Service Abstraction Contract
 * Decouples business logic from Cloudflare R2 / AWS S3 implementation.
 */
export interface IStorageService {
  /**
   * Generates a signed PUT URL for direct browser-to-R2 upload.
   * Large files bypass the Next.js server entirely.
   */
  generatePresignedUploadUrl(
    options: UploadFileOptions,
    expiresInSeconds?: number
  ): Promise<PresignedUploadUrlResult>;

  /**
   * Uploads an in-memory Buffer directly from server (e.g. for server-generated assets).
   */
  uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    cacheControl?: string
  ): Promise<StoredAsset>;

  /**
   * Deletes an object from object storage.
   */
  deleteObject(storageKey: string): Promise<void>;

  /**
   * Deletes multiple objects in a single batch.
   */
  deleteObjects(storageKeys: string[]): Promise<void>;

  /**
   * Checks existence and retrieves metadata for an object in storage.
   */
  getObjectMetadata(storageKey: string): Promise<StorageObjectMetadata>;

  /**
   * Generates the public CDN URL for a given storage key.
   */
  getPublicUrl(storageKey: string): string;
}
