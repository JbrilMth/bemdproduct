"use server";

import { revalidatePath } from "next/cache";
import {
  createQuotationRequest,
  createSourcingRequest,
  updateRequestStatus,
  updateRequestInternalNotes,
} from "@/lib/db/requests";
import {
  quotationRequestSchema,
  sourcingRequestSchema,
  updateRequestStatusSchema,
} from "@/lib/validations";
import { RequestStatus } from "@prisma/client";
import { requireAdminSession, getAdminSecretPath } from "@/lib/auth";

export type ActionResult<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export async function submitQuotationRequestAction(
  formData: unknown
): Promise<ActionResult> {
  try {
    const validated = quotationRequestSchema.safeParse(formData);
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Please fill all required fields correctly.";
      console.warn("Quotation request validation failed:", fieldErrors);
      return {
        success: false,
        message: firstError,
        errors: fieldErrors,
      };
    }

    const request = await createQuotationRequest(validated.data);
    const adminPath = `/${getAdminSecretPath()}`;
    revalidatePath(adminPath);
    revalidatePath(`${adminPath}/requests`);

    return {
      success: true,
      message: "Your quotation request has been submitted successfully! Our sourcing team will contact you via WhatsApp / Email shortly.",
      data: { id: request.id },
    };
  } catch (error: any) {
    console.error("Error submitting quotation request:", error);
    return {
      success: false,
      message: error.message || "Failed to submit quotation request. Please try again.",
    };
  }
}

export async function submitSourcingRequestAction(
  formData: unknown
): Promise<ActionResult> {
  try {
    const validated = sourcingRequestSchema.safeParse(formData);
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Please fill all required fields correctly.";
      console.warn("Sourcing request validation failed:", fieldErrors);
      return {
        success: false,
        message: firstError,
        errors: fieldErrors,
      };
    }

    const request = await createSourcingRequest(validated.data);
    const adminPath = `/${getAdminSecretPath()}`;
    revalidatePath(adminPath);
    revalidatePath(`${adminPath}/requests`);

    return {
      success: true,
      message: "Your custom sourcing request has been received! Our China sourcing team will begin product verification and contact you within 24 hours.",
      data: { id: request.id },
    };
  } catch (error: any) {
    console.error("Error submitting sourcing request:", error);
    return {
      success: false,
      message: error.message || "Failed to submit sourcing request. Please try again.",
    };
  }
}

export async function updateRequestStatusAction(
  requestId: string,
  status: RequestStatus
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    const validated = updateRequestStatusSchema.safeParse({ status });
    if (!validated.success) {
      return {
        success: false,
        message: "Invalid status value provided.",
      };
    }

    const updated = await updateRequestStatus(requestId, validated.data.status);
    revalidatePath(adminPath);
    revalidatePath(`${adminPath}/requests`);
    revalidatePath(`${adminPath}/requests/${requestId}`);

    return {
      success: true,
      message: `Request status updated to ${status}`,
      data: updated,
    };
  } catch (error: any) {
    console.error("Error updating request status:", error);
    return {
      success: false,
      message: error.message || "Failed to update request status.",
    };
  }
}

export async function updateRequestInternalNotesAction(
  requestId: string,
  internalNotes: string
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const adminPath = `/${getAdminSecretPath()}`;

    const updated = await updateRequestInternalNotes(requestId, internalNotes);
    revalidatePath(`${adminPath}/requests/${requestId}`);

    return {
      success: true,
      message: "Internal notes saved.",
      data: updated,
    };
  } catch (error: any) {
    console.error("Error saving internal notes:", error);
    return {
      success: false,
      message: error.message || "Failed to save internal notes.",
    };
  }
}
