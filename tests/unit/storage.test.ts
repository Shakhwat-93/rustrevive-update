import { describe, it, expect } from "vitest";
import { sanitizeFilename, generateStorageKey } from "@/lib/storage/key-generator";
import { R2StorageProvider } from "@/lib/storage/r2-storage.provider";

describe("Storage Key Generator", () => {
  it("should sanitize filenames and strip directory traversal sequences", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("Vintage Denim Jacket (90's Edition!).jpg")).toBe("vintage-denim-jacket-90-s-edition-.jpg");
    expect(sanitizeFilename("___unclean__file___name...png")).toBe("unclean-file-name...png");
  });

  it("should generate collision-free, namespaced storage keys", () => {
    const key1 = generateStorageKey("products", "jacket.png");
    const key2 = generateStorageKey("products", "jacket.png");

    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^products\/\d{4}\/\d{2}\/[a-f0-9-]+_jacket\.png$/);
  });
});

describe("R2StorageProvider Instantiation", () => {
  it("should instantiate without throwing and compute public CDN URLs", () => {
    const provider = new R2StorageProvider({
      accountId: "mock-account-id",
      accessKeyId: "mock-access-key",
      secretAccessKey: "mock-secret-key",
      bucketName: "rustrevive-media-prod",
      publicMediaUrl: "https://media.rustrevive.store",
    });

    const publicUrl = provider.getPublicUrl("products/2026/08/sample.webp");
    expect(publicUrl).toBe("https://media.rustrevive.store/products/2026/08/sample.webp");
  });
});
