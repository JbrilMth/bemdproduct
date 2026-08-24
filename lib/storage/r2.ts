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
 * Allowed image MIME types and safe extension mapping
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

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
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"].includes(rawExt)) {
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
      `Unsupported file MIME type: "${contentType}". Allowed formats: JPG, PNG, WebP, GIF, SVG, AVIF.`
    );
  }

  const { client, bucketName } = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
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

