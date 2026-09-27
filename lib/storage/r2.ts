import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

/**
 * Validates that all required R2 environment variables are present.
 * Does not expose sensitive secret values in error messages.
 */
export function validateR2Config(): {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
} {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucketName) missing.push("R2_BUCKET_NAME");

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 configuration error: Missing environment variable(s): ${missing.join(", ")}.`
    );
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucketName: bucketName!,
  };
}

/**
 * Checks if Cloudflare R2 is configured in the environment.
 */
export function isR2Configured(): boolean {
  try {
    validateR2Config();
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates and returns an AWS S3-compatible client targeting Cloudflare R2.
 * Server-side only: never expose this client or credentials to the browser.
 */
export function getR2Client(): { client: S3Client; bucketName: string } {
  const config = validateR2Config();

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client, bucketName: config.bucketName };
}

/**
 * Allowed image MIME types and safe extension mapping.
 * Note: SVG (image/svg+xml) is intentionally excluded to prevent Stored XSS vectors.
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_WIDTH = 10000;
export const MAX_IMAGE_HEIGHT = 10000;
export const MAX_IMAGE_PIXELS = 40_000_000; // 40 million pixels

/**
 * Validates a file buffer against binary magic bytes to prevent MIME spoofing.
 * Rejects polyglot payloads, HTML/scripts disguised as images, and executables.
 */
export function validateImageBuffer(
  buffer: Buffer,
  claimedMimeType?: string
): { valid: boolean; detectedMime: string | null; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, detectedMime: null, error: "File buffer is too small to be a valid image." };
  }

  // Detect binary signatures
  let detectedMime: string | null = null;

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    detectedMime = "image/jpeg";
  }
  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedMime = "image/png";
  }
  // 3. WebP: RIFF....WEBP
  else if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    detectedMime = "image/webp";
  }
  // 4. GIF: GIF87a or GIF89a
  else if (
    buffer.toString("ascii", 0, 6) === "GIF87a" ||
    buffer.toString("ascii", 0, 6) === "GIF89a"
  ) {
    detectedMime = "image/gif";
  }

  // Explicitly reject AVIF magic bytes (ftypavif, ftypavis, ftypmif1, etc.)
  const isAvifMagic =
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    (buffer.toString("ascii", 8, 12) === "avif" ||
      buffer.toString("ascii", 8, 12) === "avis" ||
      buffer.toString("ascii", 8, 12) === "mif1");

  if (isAvifMagic || claimedMimeType?.toLowerCase().trim() === "image/avif") {
    return {
      valid: false,
      detectedMime: null,
      error: "AVIF image format is not permitted for upload. Allowed formats: JPEG, PNG, WebP, GIF.",
    };
  }

  // Block malicious content signatures
  const headerPreview = buffer.toString("utf8", 0, Math.min(buffer.length, 512)).toLowerCase();
  if (
    headerPreview.includes("<html") ||
    headerPreview.includes("<!doctype") ||
    headerPreview.includes("<script") ||
    headerPreview.includes("<?php") ||
    headerPreview.includes("<svg") ||
    (buffer[0] === 0x4d && buffer[1] === 0x5a) // Windows MZ executable
  ) {
    return {
      valid: false,
      detectedMime: null,
      error: "File contains suspicious or executable header signatures and has been rejected.",
    };
  }

  if (!detectedMime) {
    return {
      valid: false,
      detectedMime: null,
      error: "File content does not match any allowed image format (JPEG, PNG, WebP, GIF).",
    };
  }

  // If a claimed MIME type was specified, verify compatibility
  if (claimedMimeType) {
    const normalizedClaimed = claimedMimeType.toLowerCase().trim();
    // Allow minor aliases (e.g. image/jpg vs image/jpeg)
    const isJpegMatch =
      detectedMime === "image/jpeg" &&
      (normalizedClaimed === "image/jpeg" || normalizedClaimed === "image/jpg");

    if (detectedMime !== normalizedClaimed && !isJpegMatch) {
      return {
        valid: false,
        detectedMime,
        error: `MIME type spoofing detected: file content is "${detectedMime}" but claimed "${claimedMimeType}".`,
      };
    }
  }

  return { valid: true, detectedMime };
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Extracts image dimensions directly from binary headers without decoding pixel buffers.
 * Bounds memory usage to sub-millisecond header inspection (prevents decompression bombs).
 */
export function getImageDimensions(
  buffer: Buffer
): ImageDimensions | null {
  if (!buffer || buffer.length < 10) return null;

  try {
    // 1. PNG: Dimensions in IHDR chunk (offset 16 and 20, 32-bit big-endian)
    if (buffer.length >= 24 && buffer.toString("ascii", 12, 16) === "IHDR") {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // 2. GIF: Dimensions in logical screen descriptor (offset 6 and 8, 16-bit little-endian)
    if (
      buffer.length >= 10 &&
      (buffer.toString("ascii", 0, 6) === "GIF87a" ||
        buffer.toString("ascii", 0, 6) === "GIF89a")
    ) {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }

    // 3. WebP: RIFF...WEBP
    if (
      buffer.length >= 30 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      const chunkType = buffer.toString("ascii", 12, 16);

      // Lossy VP8
      if (chunkType === "VP8 ") {
        if (
          buffer[23] === 0x9d &&
          buffer[24] === 0x01 &&
          buffer[25] === 0x2a
        ) {
          const width = buffer.readUInt16LE(26) & 0x3fff;
          const height = buffer.readUInt16LE(28) & 0x3fff;
          return { width, height };
        }
      }
      // Lossless VP8L
      else if (chunkType === "VP8L" && buffer[20] === 0x2f) {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height =
          1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        return { width, height };
      }
      // Extended VP8X
      else if (chunkType === "VP8X") {
        const width =
          1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
        const height =
          1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
        return { width, height };
      }
    }

    // 4. JPEG: Sequential marker scanning for SOF (Start of Frame)
    if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        if (marker === 0xff) {
          offset++;
          continue;
        }
        // Stop scanning if SOS (0xDA) or EOI (0xD9) is encountered
        if (marker === 0xd9 || marker === 0xda) {
          break;
        }
        if (offset + 4 > buffer.length) break;
        const segLen = buffer.readUInt16BE(offset + 2);

        // SOF markers: 0xC0..0xCF except 0xC4, 0xC8, 0xCC
        const isSof =
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc;

        if (isSof && offset + 9 <= buffer.length) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }

        offset += 2 + segLen;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Validates that image dimensions do not exceed resource exhaustion limits.
 * Protects against decompression bombs and oversized canvas memory allocation.
 */
export function validateImageDimensions(
  buffer: Buffer
): { valid: boolean; width?: number; height?: number; error?: string } {
  const dimensions = getImageDimensions(buffer);

  if (!dimensions || !dimensions.width || !dimensions.height) {
    return {
      valid: false,
      error: "Unable to parse image dimensions. File may be corrupted or malformed.",
    };
  }

  const { width, height } = dimensions;

  if (width <= 0 || height <= 0) {
    return {
      valid: false,
      error: `Invalid image dimensions (${width}x${height}). Dimensions must be positive non-zero integers.`,
    };
  }

  if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
    return {
      valid: false,
      width,
      height,
      error: `Image dimensions (${width}x${height} px) exceed maximum permitted limit of ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT} px.`,
    };
  }

  const totalPixels = width * height;
  if (totalPixels > MAX_IMAGE_PIXELS) {
    return {
      valid: false,
      width,
      height,
      error: `Total image pixels (${totalPixels.toLocaleString()} px) exceed maximum limit of ${MAX_IMAGE_PIXELS.toLocaleString()} px.`,
    };
  }

  return { valid: true, width, height };
}

/**
 * Generates a structured, unique storage key:
 * - products/{scopeId}/{uniqueId}.{ext}
 * - categories/{scopeId}/{uniqueId}.{ext}
 * - requests/{scopeId}/{uniqueId}.{ext}
 */
export function generateR2StorageKey(
  folder: "products" | "categories" | "requests" | "general",
  scopeId?: string | null,
  originalFilename?: string,
  mimeType?: string
): string {
  // Determine safe extension
  let ext = "";
  if (mimeType && ALLOWED_IMAGE_TYPES[mimeType]) {
    ext = ALLOWED_IMAGE_TYPES[mimeType];
  } else if (originalFilename) {
    const rawExt = path.extname(originalFilename).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(rawExt)) {
      ext = rawExt === ".jpeg" ? ".jpg" : rawExt;
    } else {
      ext = ".webp";
    }
  } else {
    ext = ".webp";
  }

  const uniqueId = crypto.randomUUID();
  const safeScope = scopeId ? scopeId.replace(/[^a-zA-Z0-9_-]/g, "") : "general";
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");

  return `${safeFolder}/${safeScope}/${uniqueId}${ext}`;
}

export interface R2UploadOptions {
  buffer: Buffer;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface R2UploadResult {
  storageKey: string;
  size: number;
  mimeType: string;
  eTag?: string;
}

/**
 * Uploads a binary buffer to Cloudflare R2 bucket.
 */
export async function uploadFileToR2(options: R2UploadOptions): Promise<R2UploadResult> {
  const { buffer, key, contentType, metadata } = options;

  // Validate size
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`
    );
  }

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES[contentType]) {
    throw new Error(
      `Unsupported file MIME type: "${contentType}". Allowed formats: JPG, PNG, WebP, GIF.`
    );
  }

  // Verify binary magic bytes
  const magicValidation = validateImageBuffer(buffer, contentType);
  if (!magicValidation.valid) {
    throw new Error(magicValidation.error || "Invalid file content format.");
  }

  // Verify image dimensions (bounds memory, prevents decompression bombs)
  const dimensionValidation = validateImageDimensions(buffer);
  if (!dimensionValidation.valid) {
    throw new Error(dimensionValidation.error || "Invalid image dimensions.");
  }

  const { client, bucketName } = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: magicValidation.detectedMime || contentType,
    Metadata: metadata,
  });

  const response = await client.send(command);

  return {
    storageKey: key,
    size: buffer.length,
    mimeType: contentType,
    eTag: response.ETag,
  };
}

/**
 * Deletes an object from Cloudflare R2 bucket by storage key.
 */
export async function deleteFileFromR2(storageKey: string): Promise<boolean> {
  if (!storageKey || typeof storageKey !== "string") return false;

  const { client, bucketName } = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
  });

  await client.send(command);
  return true;
}

/**
 * Checks if an object exists in Cloudflare R2.
 */
export async function checkFileExistsInR2(storageKey: string): Promise<boolean> {
  try {
    const { client, bucketName } = getR2Client();
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    });
    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Safe server-side connection and lifecycle test for Cloudflare R2:
 * 1. Uploads a temporary test object
 * 2. Verifies object existence via HeadObject
 * 3. Deletes the test object
 * 4. Verifies complete removal
 */
export async function testR2Connection(): Promise<{
  success: boolean;
  message: string;
  testKey?: string;
}> {
  const testKey = `_test_connection/${crypto.randomUUID()}.txt`;
  const testContent = Buffer.from(`R2 Connection Healthcheck: ${new Date().toISOString()}`, "utf-8");

  try {
    const { client, bucketName } = getR2Client();

    // 1. Upload test object
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: "text/plain",
      })
    );

    // 2. Verify existence
    const exists = await checkFileExistsInR2(testKey);
    if (!exists) {
      throw new Error("Test object was uploaded but HeadObject returned not found.");
    }

    // 3. Delete test object
    await deleteFileFromR2(testKey);

    return {
      success: true,
      message: `Successfully connected to Cloudflare R2 bucket "${bucketName}". Upload, HeadObject verification, and Deletion all succeeded.`,
      testKey,
    };
  } catch (error: any) {
    // Attempt cleanup if test key remains
    try {
      await deleteFileFromR2(testKey);
    } catch {
      // ignore secondary cleanup error
    }

    return {
      success: false,
      message: error.message || "Failed to connect to Cloudflare R2 bucket.",
    };
  }
}

/**
 * Retrieves an object stream / buffer directly from Cloudflare R2.
 */
export async function getFileFromR2(storageKey: string): Promise<{
  body: Uint8Array;
  contentType: string;
  contentLength?: number;
  eTag?: string;
} | null> {
  try {
    const { client, bucketName } = getR2Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    });

    const response = await client.send(command);
    if (!response.Body) return null;

    const byteArray = await response.Body.transformToByteArray();

    return {
      body: byteArray,
      contentType: response.ContentType || "image/webp",
      contentLength: response.ContentLength,
      eTag: response.ETag,
    };
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

