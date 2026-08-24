"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/db/products";
import { productFormSchema } from "@/lib/validations";
import { ProductStatus } from "@prisma/client";
import { requireAdminSession, getAdminSecretPath } from "@/lib/auth";
import { ActionResult } from "./requests";

export async function createProductAction(formData: unknown): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    const validated = productFormSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        message: "Please fix the validation errors in the product form.",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const newProduct = await createProduct({
      ...validated.data,
      status: validated.data.status as ProductStatus,
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");
    revalidatePath(`${adminPath}/products`);
    revalidatePath(adminPath);

    return {
      success: true,
      message: `Product "${newProduct.name}" created successfully!`,
      data: newProduct,
    };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: error.message || "Failed to create product.",
    };
  }
}

export async function updateProductAction(
  productId: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    const validated = productFormSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        message: "Please fix the validation errors in the product form.",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const updated = await updateProduct(productId, {
      ...validated.data,
      status: validated.data.status as ProductStatus,
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${updated.slug}`);
    revalidatePath("/categories");
    revalidatePath(`${adminPath}/products`);
    revalidatePath(adminPath);

    return {
      success: true,
      message: `Product "${updated.name}" updated successfully!`,
      data: updated,
    };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return {
      success: false,
      message: error.message || "Failed to update product.",
    };
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    await deleteProduct(productId);

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");
    revalidatePath(`${adminPath}/products`);
    revalidatePath(adminPath);

    return {
      success: true,
      message: "Product deleted successfully.",
    };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      message: error.message || "Failed to delete product.",
    };
  }
}

export async function toggleProductStatusAction(
  productId: string,
  status: ProductStatus
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    const updated = await updateProduct(productId, { status });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${updated.slug}`);
    revalidatePath(`${adminPath}/products`);
    revalidatePath(adminPath);

    return {
      success: true,
      message: `Product status changed to ${status}.`,
      data: updated,
    };
  } catch (error: any) {
    console.error("Error changing product status:", error);
    return {
      success: false,
      message: error.message || "Failed to update product status.",
    };
  }
}
