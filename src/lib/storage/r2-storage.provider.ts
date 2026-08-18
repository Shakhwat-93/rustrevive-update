import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicMediaUrl: string;
  endpoint?: string;
}

export class R2StorageProvider implements IStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicMediaUrl: string;

  constructor(config: R2ProviderConfig) {
    this.bucketName = config.bucketName;
    this.publicMediaUrl = config.publicMediaUrl.replace(/\/$/, "");

    const endpoint =
      config.endpoint ||
      `https://${config.accountId}.r2.cloudflarestorage.com`;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  public getPublicUrl(storageKey: string): string {
    const cleanKey = storageKey.replace(/^\//, "");
    return `${this.publicMediaUrl}/${cleanKey}`;
  }

  public async generatePresignedUploadUrl(
    options: UploadFileOptions,
    expiresInSeconds = 900 // 15 minutes default
  ): Promise<PresignedUploadUrlResult> {
    try {
      const storageKey = generateStorageKey(options.namespace, options.filename);
      const cacheControl = options.cacheControl || "public, max-age=31536000, immutable";

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ContentType: options.contentType,
        CacheControl: cacheControl,
        Metadata: options.metadata,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      const publicUrl = this.getPublicUrl(storageKey);

      logger.info(`Generated presigned upload URL for key: ${storageKey}`, "R2StorageProvider", {
        namespace: options.namespace,
        contentType: options.contentType,
      });

      return {
        uploadUrl,
        storageKey,
        publicUrl,
        expiresInSeconds,
        requiredHeaders: {
          "Content-Type": options.contentType,
          "Cache-Control": cacheControl,
        },
      };
    } catch (error) {
      logger.error("Failed to generate presigned upload URL", error, "R2StorageProvider");
      throw new StorageError("Failed to generate presigned upload URL", {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    cacheControl = "public, max-age=31536000, immutable"
  ): Promise<StoredAsset> {
    try {
      const cleanKey = key.replace(/^\//, "");
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: cleanKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
      });

      const response = await this.s3Client.send(command);
      const publicUrl = this.getPublicUrl(cleanKey);

      return {
        storageKey: cleanKey,
        bucket: this.bucketName,
        publicUrl,
        fileSizeBytes: buffer.length,
        mimeType: contentType,
        eTag: response.ETag,
      };
    } catch (error) {
      logger.error(`Failed to upload buffer to key: ${key}`, error, "R2StorageProvider");
      throw new StorageError(`Failed to upload buffer to storage key: ${key}`, {
        key,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async deleteObject(storageKey: string): Promise<void> {
    try {
      const cleanKey = storageKey.replace(/^\//, "");
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: cleanKey,
      });

      await this.s3Client.send(command);
      logger.info(`Deleted storage object: ${cleanKey}`, "R2StorageProvider");
    } catch (error) {
      logger.error(`Failed to delete storage object: ${storageKey}`, error, "R2StorageProvider");
      throw new StorageError(`Failed to delete object from storage: ${storageKey}`);
    }
  }

  public async deleteObjects(storageKeys: string[]): Promise<void> {
    if (storageKeys.length === 0) return;

    try {
      const objects = storageKeys.map((key) => ({ Key: key.replace(/^\//, "") }));
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: objects,
          Quiet: true,
        },
      });

      await this.s3Client.send(command);
      logger.info(`Deleted ${storageKeys.length} storage objects in batch`, "R2StorageProvider");
    } catch (error) {
      logger.error("Failed to delete objects batch from storage", error, "R2StorageProvider");
      throw new StorageError("Failed to delete batch of objects from storage");
    }
  }

  public async getObjectMetadata(storageKey: string): Promise<StorageObjectMetadata> {
    try {
      const cleanKey = storageKey.replace(/^\//, "");
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: cleanKey,
      });

      const response = await this.s3Client.send(command);
      return {
        exists: true,
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        eTag: response.ETag,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error: unknown) {
      const isNotFound =
        error && typeof error === "object" && "name" in error && error.name === "NotFound";
      
      if (isNotFound) {
        return { exists: false };
      }

      logger.error(`Failed to get metadata for storage key: ${storageKey}`, error, "R2StorageProvider");
      throw new StorageError(`Failed to retrieve object metadata: ${storageKey}`);
    }
  }
}
