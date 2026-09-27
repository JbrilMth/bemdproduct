import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import {
  ProductWithDetails,
  ProductFilterParams,
  CreateProductInput,
} from "@/types";

export async function getProducts(params: ProductFilterParams): Promise<{
  products: ProductWithDetails[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const {
    search,
    categorySlug,
    tag,
    isFeatured,
    isNew,
    isTrending,
    page = 1,
    pageSize = 12,
  } = params;

  // Strict sanitization and resource bounds
  const safePage = Math.max(1, Math.min(Number(page) || 1, 1000));
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 12, 60));
  const safeSearch = search ? search.trim().slice(0, 100) : "";

  const where: any = {
    status: ProductStatus.PUBLISHED,
  };

  // Search filter with bounded length
  if (safeSearch !== "") {
    where.OR = [
      { name: { contains: safeSearch, mode: "insensitive" } },
      { shortDescription: { contains: safeSearch, mode: "insensitive" } },
      { description: { contains: safeSearch, mode: "insensitive" } },
    ];
  }

  // Category filter
  if (categorySlug && categorySlug !== "") {
    where.category = {
      OR: [
        { slug: categorySlug },
        { parent: { slug: categorySlug } },
      ],
    };
  }

  // Tag filter
  if (tag && tag !== "") {
    where.tags = {
      some: {
        tag: {
          slug: tag,
        },
      },
    };
  }

  // Boolean flags
  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  if (isNew !== undefined) where.isNew = isNew;
  if (isTrending !== undefined) where.isTrending = isTrending;

  const skip = (safePage - 1) * safePageSize;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
        },
        specifications: {
          orderBy: { sortOrder: "asc" },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      skip,
      take: safePageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products as ProductWithDetails[],
    total,
    totalPages: Math.ceil(total / safePageSize),
    currentPage: safePage,
  };
}

export async function getAllProductsForAdmin(params?: {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{
  products: ProductWithDetails[];
  total: number;
  totalPages: number;
}> {
  const {
    search,
    categoryId,
    status,
    isFeatured,
    isNew,
    isTrending,
    page = 1,
    pageSize = 20,
  } = params || {};

  const safePage = Math.max(1, Math.min(Number(page) || 1, 1000));
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 20, 100));
  const safeSearch = search ? search.trim().slice(0, 100) : "";

  const where: any = {};

  if (safeSearch !== "") {
    where.OR = [
      { name: { contains: safeSearch, mode: "insensitive" } },
      { shortDescription: { contains: safeSearch, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status) {
    where.status = status;
  }

  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  if (isNew !== undefined) where.isNew = isNew;
  if (isTrending !== undefined) where.isTrending = isTrending;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
        },
        specifications: {
          orderBy: { sortOrder: "asc" },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products as ProductWithDetails[],
    total,
    totalPages: Math.ceil(total / safePageSize),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return product as ProductWithDetails | null;
}

export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return product as ProductWithDetails | null;
}

export async function getFeaturedProducts(limit = 4): Promise<ProductWithDetails[]> {
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
    },
    include: {
      category: {
        include: { parent: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
      },
      tags: {
        include: { tag: true },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products as ProductWithDetails[];
}

export async function getTrendingProducts(limit = 4): Promise<ProductWithDetails[]> {
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      isTrending: true,
    },
    include: {
      category: {
        include: { parent: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
      },
      tags: {
        include: { tag: true },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products as ProductWithDetails[];
}

export async function getNewArrivalProducts(limit = 4): Promise<ProductWithDetails[]> {
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      isNew: true,
    },
    include: {
      category: {
        include: { parent: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
      },
      tags: {
        include: { tag: true },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products as ProductWithDetails[];
}

export async function getRelatedProducts(
  currentProductId: string,
  categoryId: string,
  limit = 4
): Promise<ProductWithDetails[]> {
  const products = await prisma.product.findMany({
    where: {
      id: { not: currentProductId },
      categoryId,
      status: ProductStatus.PUBLISHED,
    },
    include: {
      category: {
        include: { parent: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
      },
      tags: {
        include: { tag: true },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products as ProductWithDetails[];
}

export async function createProduct(data: CreateProductInput) {
  return prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
      description: data.description,
      categoryId: data.categoryId,
      status: data.status,
      isFeatured: data.isFeatured ?? false,
      isNew: data.isNew ?? false,
      isTrending: data.isTrending ?? false,
      images: {
        create: data.images.map((img) => ({
          imageUrl: img.imageUrl,
          storageKey: img.storageKey || null,
          sortOrder: img.sortOrder,
        })),
      },
      specifications: {
        create: data.specifications.map((spec) => ({
          name: spec.name,
          value: spec.value,
          sortOrder: spec.sortOrder,
        })),
      },
      tags: {
        create: data.tagIds.map((tagId) => ({
          tagId,
        })),
      },
    },
    include: {
      category: true,
      images: true,
      specifications: true,
      tags: { include: { tag: true } },
    },
  });
}

export async function updateProduct(id: string, data: Partial<CreateProductInput>) {
  const hasRelationUpdates =
    data.images !== undefined ||
    data.specifications !== undefined ||
    data.tagIds !== undefined;

  // Direct update if relation arrays are not modified
  if (!hasRelationUpdates) {
    return prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        categoryId: data.categoryId,
        status: data.status,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
        isTrending: data.isTrending,
      },
      include: {
        category: {
          include: { parent: true },
        },
        images: true,
        specifications: true,
        tags: { include: { tag: true } },
      },
    });
  }

  // Multi-step update with 25s timeout for remote cloud connections
  return prisma.$transaction(
    async (tx) => {
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img) => ({
              productId: id,
              imageUrl: img.imageUrl,
              storageKey: img.storageKey || null,
              sortOrder: img.sortOrder,
            })),
          });
        }
      }

      if (data.specifications) {
        await tx.productSpecification.deleteMany({ where: { productId: id } });
        if (data.specifications.length > 0) {
          await tx.productSpecification.createMany({
            data: data.specifications.map((spec) => ({
              productId: id,
              name: spec.name,
              value: spec.value,
              sortOrder: spec.sortOrder,
            })),
          });
        }
      }

      if (data.tagIds) {
        await tx.productTag.deleteMany({ where: { productId: id } });
        if (data.tagIds.length > 0) {
          await tx.productTag.createMany({
            data: data.tagIds.map((tagId) => ({
              productId: id,
              tagId,
            })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          shortDescription: data.shortDescription,
          description: data.description,
          categoryId: data.categoryId,
          status: data.status,
          isFeatured: data.isFeatured,
          isNew: data.isNew,
          isTrending: data.isTrending,
        },
        include: {
          category: {
            include: { parent: true },
          },
          images: true,
          specifications: true,
          tags: { include: { tag: true } },
        },
      });
    },
    {
      maxWait: 15000,
      timeout: 25000,
    }
  );
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
  });
}
