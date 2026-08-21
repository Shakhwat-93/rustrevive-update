import "server-only";
import type { IStorageService } from "@/lib/storage/storage.interface";
import { generateStorageKey } from "@/lib/storage/key-generator";
import { StorageError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type {
  UploadFileOptions,
  StoredAsset,
  PresignedUploadUrlResult,
  StorageObjectMetadata,
} from "@/types/storage.types";

export interface R2ProviderConfig {
  accountId: string;
  bucketName: string;
  publicMediaUrl: string;
  apiToken?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

export class R2StorageProvider implements IStorageService {
  private accountId: string;
  private bucketName: string;
  private publicMediaUrl: string;
  private apiToken: string;

  constructor(config: R2ProviderConfig) {
    this.accountId = config.accountId;
    this.bucketName = config.bucketName;
    this.publicMediaUrl = (config.publicMediaUrl || "").replace(/\/$/, "");
    this.apiToken = config.apiToken || process.env.CLOUDFLARE_API_TOKEN || "";
  }

  public getPublicUrl(storageKey: string): string {
    const cleanKey = storageKey.replace(/^\//, "");
    if (this.publicMediaUrl && !this.publicMediaUrl.includes("localhost")) {
      return `${this.publicMediaUrl}/${cleanKey}`;
    }
    return `/api/media/${cleanKey}`;
  }

  /**
   * Uploads an image/media buffer directly to Cloudflare R2 bucket via authenticated REST API
   */
  public async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    cacheControl = "public, max-age=31536000, immutable"
  ): Promise<StoredAsset> {
    const cleanKey = key.replace(/^\//, "");
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${encodeURI(cleanKey)}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
        },
        body: new Uint8Array(buffer),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Cloudflare R2 upload failed with HTTP ${response.status}`, errorText, "R2StorageProvider", { key: cleanKey });
        throw new Error(`R2 HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const etag = json?.result?.etag || response.headers.get("etag") || undefined;
      const publicUrl = this.getPublicUrl(cleanKey);

      logger.info(`Uploaded object to Cloudflare R2: ${cleanKey}`, "R2StorageProvider", {
        size: buffer.length,
        contentType,
        etag,
      });

      return {
        storageKey: cleanKey,
        bucket: this.bucketName,
        publicUrl,
        fileSizeBytes: buffer.length,
        mimeType: contentType,
        eTag: etag,
      };
    } catch (error) {
      logger.error(`Failed to upload buffer to Cloudflare R2 key: ${key}`, error, "R2StorageProvider");
      throw new StorageError(`Failed to upload buffer to storage key: ${key}`, {
        key,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Retrieves an object binary directly from Cloudflare R2
   */
  public async getObject(key: string): Promise<{
    buffer: Buffer;
    contentType: string;
    etag?: string;
    lastModified?: string;
    contentLength: number;
  }> {
    const cleanKey = key.replace(/^\//, "");
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${encodeURI(cleanKey)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`R2 HTTP ${response.status}: Object '${cleanKey}' not found or unreachable`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/webp";
      const etag = response.headers.get("etag") || undefined;
      const lastModified = response.headers.get("last-modified") || undefined;

      return {
        buffer,
        contentType,
        etag,
        lastModified,
        contentLength: buffer.length,
      };
    } catch (error) {
      logger.error(`Failed to get object from Cloudflare R2: ${key}`, error, "R2StorageProvider");
      throw new StorageError(`Failed to get storage object: ${key}`, {
        key,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Deletes an object from Cloudflare R2
   */
  public async deleteObject(storageKey: string): Promise<void> {
    const cleanKey = storageKey.replace(/^\//, "");
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${encodeURI(cleanKey)}`;

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        throw new Error(`R2 HTTP ${response.status}: ${errorText}`);
      }

      logger.info(`Deleted storage object from Cloudflare R2: ${cleanKey}`, "R2StorageProvider");
    } catch (error) {
      logger.error(`Failed to delete storage object: ${storageKey}`, error, "R2StorageProvider");
      throw new StorageError(`Failed to delete storage object: ${storageKey}`, {
        storageKey,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Deletes multiple objects from Cloudflare R2
   */
  public async deleteObjects(storageKeys: string[]): Promise<void> {
    for (const key of storageKeys) {
      await this.deleteObject(key);
    }
  }

  /**
   * Inspects object metadata in Cloudflare R2
   */
  public async getObjectMetadata(storageKey: string): Promise<StorageObjectMetadata> {
    const cleanKey = storageKey.replace(/^\//, "");
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${encodeURI(cleanKey)}`;

    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        return { exists: false };
      }

      return {
        exists: true,
        contentLength: Number(response.headers.get("content-length")) || 0,
        contentType: response.headers.get("content-type") || "application/octet-stream",
        eTag: response.headers.get("etag") || undefined,
        lastModified: response.headers.get("last-modified")
          ? new Date(response.headers.get("last-modified")!)
          : undefined,
        metadata: {},
      };
    } catch (error) {
      throw new StorageError(`Failed to retrieve metadata for: ${storageKey}`, {
        storageKey,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async generatePresignedUploadUrl(
    options: UploadFileOptions,
    expiresInSeconds = 900
  ): Promise<PresignedUploadUrlResult> {
    const storageKey = generateStorageKey(options.namespace, options.filename);
    const publicUrl = this.getPublicUrl(storageKey);

    return {
      uploadUrl: `/api/admin/media/upload`,
      storageKey,
      publicUrl,
      expiresInSeconds,
      requiredHeaders: {
        "Content-Type": options.contentType,
      },
    };
  }
}
