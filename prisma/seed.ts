import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const FORBIDDEN_DEV_PASSWORDS = [
  "AdminPassword123!",
  "admin",
  "password",
  "12345678",
  "changeme",
];

async function main() {
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`🌱 Running database seed (Environment: ${process.env.NODE_ENV || "development"})...`);

  // Guard against destructive clearing in production
  if (isProduction && process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    console.log("ℹ️  Production mode detected: skipping destructive wipe of existing business data.");
  } else {
    // Clean existing demo business records in reverse dependency order
    await prisma.requestImage.deleteMany();
    await prisma.customerRequest.deleteMany();
    await prisma.productTag.deleteMany();
    await prisma.productSpecification.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.category.deleteMany();
    console.log("🧹 Cleared demo products, categories, requests, specifications, and tags.");
  }

  // Setup Admin User for Admin Panel Access
  const adminEmail = (
    process.env.ADMIN_AUTHORIZED_EMAIL ||
    process.env.ADMIN_DEFAULT_EMAIL ||
    (isProduction ? "" : "admin@sourcinghub.com")
  ).trim();

  if (!adminEmail) {
    if (isProduction) {
      console.log("⚠️  ADMIN_AUTHORIZED_EMAIL / ADMIN_DEFAULT_EMAIL not configured. Skipping admin user creation.");
      return;
    }
  }

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    // Rule 2 & 4: Production must NOT overwrite existing admin password on rerun unless explicitly requested
    if (process.env.RESET_ADMIN_PASSWORD === "true") {
      const newPassword = process.env.ADMIN_DEFAULT_PASSWORD;
      if (!newPassword || (isProduction && (FORBIDDEN_DEV_PASSWORDS.includes(newPassword) || newPassword.length < 12))) {
        throw new Error(
          "Cannot reset production admin password: ADMIN_DEFAULT_PASSWORD must be at least 12 characters and not a default value."
        );
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.adminUser.update({
        where: { id: existingAdmin.id },
        data: { passwordHash },
      });
      console.log(`🔐 Explicitly reset password for existing Admin User: ${adminEmail}`);
    } else {
      console.log(`👤 Admin User ${adminEmail} already exists. Preserving existing password.`);
    }
  } else {
    // Admin does not exist: create initial admin user
    let adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

    if (isProduction) {
      // Rule 1 & 3: Production must NOT silently create an admin using AdminPassword123!
      if (!adminPassword) {
        throw new Error(
          "Production setup error: ADMIN_DEFAULT_PASSWORD is required in environment variables to initialize the first admin account."
        );
      }
      if (FORBIDDEN_DEV_PASSWORDS.includes(adminPassword) || adminPassword.length < 12) {
        throw new Error(
          "Production setup error: ADMIN_DEFAULT_PASSWORD must be at least 12 characters and cannot use the development default 'AdminPassword123!'."
        );
      }
    } else {
      adminPassword = adminPassword || "AdminPassword123!";
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.adminUser.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`👤 Created initial Admin User: ${admin.email}`);
  }

  console.log("✅ Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Database initialization failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
