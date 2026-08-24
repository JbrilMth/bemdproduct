import { prisma } from "@/lib/prisma";
import { CategoryStatus } from "@prisma/client";
import { CategoryWithChildren, CreateCategoryInput } from "@/types";

export async function getActiveParentCategories(): Promise<CategoryWithChildren[]> {
  return prisma.category.findMany({
    where: {
      parentId: null,
      status: CategoryStatus.ACTIVE,
    },
    include: {
      children: {
        where: {
          status: CategoryStatus.ACTIVE,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
      _count: {
        select: {
          products: {
            where: {
              status: "PUBLISHED",
            },
          },
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

export async function getAllCategoriesForAdmin(): Promise<CategoryWithChildren[]> {
  return prisma.category.findMany({
    include: {
      children: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      parent: true,
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: [
      { parentId: "asc" },
      { sortOrder: "asc" },
    ],
  });
}

export async function getCategoryBySlug(slug: string): Promise<CategoryWithChildren | null> {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { status: CategoryStatus.ACTIVE },
        orderBy: { sortOrder: "asc" },
      },
      parent: true,
      _count: {
        select: {
          products: {
            where: { status: "PUBLISHED" },
          },
        },
      },
    },
  });
}

export async function createCategory(data: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      storageKey: data.storageKey || null,
      parentId: data.parentId || null,
      status: data.status || CategoryStatus.ACTIVE,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateCategory(id: string, data: Partial<CreateCategoryInput>) {
  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description !== undefined ? data.description : undefined,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      storageKey: data.storageKey !== undefined ? data.storageKey : undefined,
      parentId: data.parentId !== undefined ? data.parentId : undefined,
      status: data.status,
      sortOrder: data.sortOrder,
    },
  });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
  });
}
