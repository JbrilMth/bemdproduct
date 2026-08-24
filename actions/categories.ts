"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/db/categories";
import { categoryFormSchema } from "@/lib/validations";
import { CategoryStatus } from "@prisma/client";
import { requireAdminSession, getAdminSecretPath } from "@/lib/auth";
import { ActionResult } from "./requests";

export async function createCategoryAction(formData: unknown): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    const validated = categoryFormSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        message: "Please fix the validation errors in the category form.",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const newCategory = await createCategory({
      ...validated.data,
      status: validated.data.status as CategoryStatus,
    });

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/products");
    revalidatePath(`${adminPath}/categories`);
    revalidatePath(adminPath);

    return {
      success: true,
      message: `Category "${newCategory.name}" created successfully!`,
      data: newCategory,
    };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return {
      success: false,
      message: error.message || "Failed to create category.",
    };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    const validated = categoryFormSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        message: "Please fix the validation errors in the category form.",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const updated = await updateCategory(categoryId, {
      ...validated.data,
      status: validated.data.status as CategoryStatus,
    });

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/products");
    revalidatePath(`${adminPath}/categories`);
    revalidatePath(adminPath);

    return {
      success: true,
      message: `Category "${updated.name}" updated successfully!`,
      data: updated,
    };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return {
      success: false,
      message: error.message || "Failed to update category.",
    };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    await deleteCategory(categoryId);

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/products");
    revalidatePath(`${adminPath}/categories`);
    revalidatePath(adminPath);

    return {
      success: true,
      message: "Category deleted successfully.",
    };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      message: error.message || "Failed to delete category.",
    };
  }
}
