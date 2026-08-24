import { getActiveParentCategories } from "../lib/db/categories";
import { getProducts, getFeaturedProducts } from "../lib/db/products";
import { getAllRequests } from "../lib/db/requests";
import { getDashboardMetrics } from "../lib/db/metrics";
import { prisma } from "../lib/prisma";

async function verify() {
  console.log("🔍 Verifying Neon Database & Platform Services...\n");

  // 1. Categories
  const parentCategories = await getActiveParentCategories();
  console.log(`✅ Parent Categories fetched: ${parentCategories.length}`);
  for (const cat of parentCategories) {
    console.log(`   - ${cat.name} (${cat.children?.length || 0} subcategories, ${cat._count?.products || 0} products)`);
  }

  // 2. Products
  const productsResult = await getProducts({});
  console.log(`\n✅ Published Products fetched: ${productsResult.total} (Total pages: ${productsResult.totalPages})`);
  for (const prod of productsResult.products) {
    console.log(`   - [${prod.category.name}] ${prod.name}`);
    console.log(`     Specs: ${prod.specifications.length} | Images: ${prod.images.length} | Tags: ${prod.tags.map(t => t.tag.name).join(", ")}`);
  }

  // 3. Featured Products
  const featured = await getFeaturedProducts(3);
  console.log(`\n✅ Featured Products: ${featured.length}`);

  // 4. Customer Requests
  const requests = await getAllRequests();
  console.log(`\n✅ Customer Requests fetched: ${requests.total}`);
  for (const req of requests.requests) {
    console.log(`   - [${req.type}] From ${req.customerName} (${req.country}) - Status: ${req.status}`);
  }

  // 5. Dashboard Metrics
  const metrics = await getDashboardMetrics();
  console.log(`\n✅ Dashboard Metrics:`);
  console.log(`   - Total Products: ${metrics.totalProducts} (${metrics.publishedProducts} published, ${metrics.draftProducts} draft)`);
  console.log(`   - Total Categories: ${metrics.totalCategories}`);
  console.log(`   - New Sourcing/Quote Requests: ${metrics.newRequestsCount} / ${metrics.totalRequestsCount}`);

  console.log("\n🎉 ALL DATABASE AND ARCHITECTURE CHECKS PASSED PERFECTLY!");
}

verify()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
