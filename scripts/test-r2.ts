import dotenv from "dotenv";
dotenv.config();

import { testR2Connection, isR2Configured } from "../lib/storage/r2";

async function main() {
  console.log("☁️ ===============================================");
  console.log("☁️ TESTING CLOUDFLARE R2 S3-COMPATIBLE STORAGE");
  console.log("☁️ ===============================================\n");

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  console.log("1. Inspecting Cloudflare R2 Environment Variables in .env:");
  console.log("   - R2_ACCESS_KEY_ID:     ", accessKeyId ? `Configured (${accessKeyId.substring(0, 6)}••••••••)` : "❌ Missing");
  console.log("   - R2_SECRET_ACCESS_KEY: ", secretKey ? "Configured (••••••••)" : "❌ Missing");
  console.log("   - R2_ACCOUNT_ID:        ", accountId ? `Configured (${accountId.substring(0, 6)}••••••••)` : "⚠️ Missing (Needed for S3 endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com)");
  console.log("   - R2_BUCKET_NAME:       ", bucketName ? `Configured ("${bucketName}")` : "⚠️ Missing (Name of your Cloudflare R2 bucket)");

  if (!isR2Configured()) {
    console.log("\n-------------------------------------------------");
    console.log("📋 ACTION REQUIRED TO COMPLETE R2 CONNECTION:");
    console.log("Please add your Cloudflare Account ID & Bucket Name to .env:");
    console.log('R2_ACCOUNT_ID="your_cloudflare_account_id_here"');
    console.log('R2_BUCKET_NAME="your_bucket_name_here"');
    console.log("-------------------------------------------------");
    return;
  }

  console.log("\n2. Executing automated connection, test upload, head-check & cleanup...");
  const result = await testR2Connection();

  console.log("\n3. Execution Summary:");
  console.log("   - Success:", result.success);
  console.log("   - Message:", result.message);

  if (!result.success) {
    console.error("\n❌ R2 connection test failed:", result.message);
    process.exit(1);
  }

  console.log("\n===============================================");
  console.log("🎉 CLOUDFLARE R2 IS 100% CONNECTED & WORKING!");
  console.log("===============================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error running R2 test:", err.message);
    process.exit(1);
  });
