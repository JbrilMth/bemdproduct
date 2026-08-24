import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Initializing clean database setup...");

  // 1. Clean existing demo business records in reverse dependency order
  await prisma.requestImage.deleteMany();
  await prisma.customerRequest.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.productSpecification.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();

  console.log("🧹 Cleared all demo products, categories, requests, specifications, and tags.");

  // 2. Setup Super Admin User for Admin Panel Access
  const defaultAdminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@sourcinghub.com";
  const defaultAdminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "AdminPassword123!";
  const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: defaultAdminEmail },
  });

  if (existingAdmin) {
    await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: {
        name: "Super Admin",
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`👤 Updated existing Admin User: ${defaultAdminEmail}`);
  } else {
    const admin = await prisma.adminUser.create({
      data: {
        name: "Super Admin",
        email: defaultAdminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`👤 Created Admin User: ${admin.email}`);
  }

  console.log("✅ Database is completely clean and ready for real catalog data!");
}

main()
  .catch((e) => {
    console.error("❌ Database initialization failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
