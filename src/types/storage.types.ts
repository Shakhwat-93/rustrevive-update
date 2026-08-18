/**
 * Media Storage Subsystem Types
 */

export type StorageNamespace =
  | "products"
  | "editorial"
  | "categories"
  | "avatars"
  | "brand"
  | "temp";

export interface UploadFileOptions {
  namespace: StorageNamespace;
  filename: string;
  contentType: string;
  fileSizeBytes?: number;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface StoredAsset {
  storageKey: string;
  bucket: string;
  publicUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  width?: number;
  height?: number;
  blurHash?: string;
  eTag?: string;
}

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  expiresInSeconds: number;
  requiredHeaders?: Record<string, string>;
}

export interface StorageObjectMetadata {
  exists: boolean;
  contentLength?: number;
  contentType?: string;
  eTag?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}
