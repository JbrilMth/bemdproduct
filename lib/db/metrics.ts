import { prisma } from "@/lib/prisma";
import { ProductStatus, RequestStatus } from "@prisma/client";
import { DashboardMetrics, CustomerRequestWithDetails } from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    totalCategories,
    newRequestsCount,
    pendingRequestsCount,
    totalRequestsCount,
    recentRequests,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.PUBLISHED } }),
    prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
    prisma.category.count(),
    prisma.customerRequest.count({ where: { status: RequestStatus.NEW } }),
    prisma.customerRequest.count({
      where: {
        status: { in: [RequestStatus.REVIEWING, RequestStatus.PROCESSING] },
      },
    }),
    prisma.customerRequest.count(),
    prisma.customerRequest.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        images: true,
      },
    }),
  ]);

  return {
    totalProducts,
    publishedProducts,
    draftProducts,
    totalCategories,
    newRequestsCount,
    pendingRequestsCount,
    totalRequestsCount,
    recentRequests: recentRequests as CustomerRequestWithDetails[],
  };
}
