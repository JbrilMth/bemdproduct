import fs from "fs";
import path from "path";
import {
  isR2Configured,
  validateR2Config,
  getR2Client,
  uploadFileToR2,
  deleteFileFromR2,
  checkFileExistsInR2,
  testR2Connection,
  generateR2StorageKey,
  validateImageBuffer,
  validateImageDimensions,
  getImageDimensions,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_PIXELS,
} from "./storage/r2";

export {
  isR2Configured,
  validateR2Config,
  getR2Client,
  uploadFileToR2,
  deleteFileFromR2,
  checkFileExistsInR2,
  testR2Connection,
  generateR2StorageKey,
  validateImageBuffer,
  validateImageDimensions,
  getImageDimensions,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_PIXELS,
};

export interface UploadResult {
  url: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Uploads an image buffer to Cloudflare R2 (or local storage fallback).
 * Performs magic-byte inspection and dimension verification before storage and uses structured unique keys:
 * - products/{scopeId}/{uniqueId}.{ext}
 * - categories/{scopeId}/{uniqueId}.{ext}
 * - requests/{scopeId}/{uniqueId}.{ext}
 */
export async function uploadToStorage(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder: "products" | "categories" | "sourcing" | "requests" | "general" = "products",
  scopeId?: string | null
): Promise<UploadResult> {
  // Validate magic bytes against MIME type before saving anywhere
  const validation = validateImageBuffer(buffer, mimeType);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file content format.");
  }
  const effectiveMime = validation.detectedMime || mimeType;

  // Validate image dimensions without decoding pixel memory
  const dimensionCheck = validateImageDimensions(buffer);
  if (!dimensionCheck.valid) {
    throw new Error(dimensionCheck.error || "Invalid image dimensions.");
  }

  // Normalize folder naming
  const mappedFolder =
    folder === "sourcing" ? "requests" : (folder as "products" | "categories" | "requests" | "general");

  const storageKey = generateR2StorageKey(mappedFolder, scopeId, originalFilename, effectiveMime);

  if (isR2Configured()) {
    // Cloudflare R2 Upload
    await uploadFileToR2({
      buffer,
      key: storageKey,
      contentType: effectiveMime,
      metadata: {
        originalFilename: encodeURIComponent(originalFilename.slice(0, 100)),
      },
    });

    const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    const url = publicBase ? `${publicBase}/${storageKey}` : `/api/media/${storageKey}`;

    return {
      url,
      storageKey,
      filename: originalFilename,
      mimeType: effectiveMime,
      size: buffer.length,
    };
  } else {
    // Local Filesystem Fallback (for offline local development)
    const baseUploadsDir = path.resolve(process.cwd(), "public", "uploads");
    const localFilePath = path.resolve(baseUploadsDir, storageKey);

    // Strict path traversal containment check
    if (!localFilePath.startsWith(baseUploadsDir)) {
      throw new Error("Security Error: Path traversal detected in storage path.");
    }

    const localDir = path.dirname(localFilePath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    fs.writeFileSync(localFilePath, buffer);

    return {
      url: `/uploads/${storageKey}`,
      storageKey,
      filename: originalFilename,
      mimeType: effectiveMime,
      size: buffer.length,
    };
  }
}
