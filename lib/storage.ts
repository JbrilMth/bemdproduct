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
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
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
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
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
 * Uses structured unique keys:
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
  // Normalize folder naming
  const mappedFolder =
    folder === "sourcing" ? "requests" : (folder as "products" | "categories" | "requests" | "general");

  const storageKey = generateR2StorageKey(mappedFolder, scopeId, originalFilename, mimeType);

  if (isR2Configured()) {
    // Cloudflare R2 Upload
    await uploadFileToR2({
      buffer,
      key: storageKey,
      contentType: mimeType,
      metadata: {
        originalFilename: encodeURIComponent(originalFilename),
      },
    });

    // In current step, R2 bucket is private. We store the storageKey.
    // For preview/reference, format URL with public URL if configured or key path
    const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    const url = publicBase ? `${publicBase}/${storageKey}` : `/api/media/${storageKey}`;

    return {
      url,
      storageKey,
      filename: originalFilename,
      mimeType,
      size: buffer.length,
    };
  } else {
    // Local Filesystem Fallback (for offline local development)
    const localRelativePath = `uploads/${storageKey}`;
    const localFilePath = path.join(process.cwd(), "public", localRelativePath);
    const localDir = path.dirname(localFilePath);

    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    fs.writeFileSync(localFilePath, buffer);

    return {
      url: `/${localRelativePath}`,
      storageKey,
      filename: originalFilename,
      mimeType,
      size: buffer.length,
    };
  }
}
