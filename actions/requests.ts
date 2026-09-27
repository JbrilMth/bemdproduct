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
  updateRequestInternalNotesSchema,
} from "@/lib/validations";
import { RequestStatus } from "@prisma/client";
import { requireAdminSession, getAdminSecretPath } from "@/lib/auth";
import { publicRequestRateLimiter, getClientIp } from "@/lib/rate-limit";

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
    // 1. IP Rate Limiting (8 submissions / min)
    const clientIp = await getClientIp();
    const rateCheck = publicRequestRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: `Too many submissions from your connection. Please wait ${rateCheck.resetInSeconds} seconds before submitting again.`,
      };
    }

    // 2. Strict Input Validation
    const validated = quotationRequestSchema.safeParse(formData);
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Please fill all required fields correctly.";
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
      message: "Failed to submit quotation request. Please check your connection and try again.",
    };
  }
}

export async function submitSourcingRequestAction(
  formData: unknown
): Promise<ActionResult> {
  try {
    // 1. IP Rate Limiting (8 submissions / min)
    const clientIp = await getClientIp();
    const rateCheck = publicRequestRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: `Too many submissions from your connection. Please wait ${rateCheck.resetInSeconds} seconds before submitting again.`,
      };
    }

    // 2. Strict Input Validation
    const validated = sourcingRequestSchema.safeParse(formData);
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Please fill all required fields correctly.";
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
      message: "Failed to submit sourcing request. Please check your connection and try again.",
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

    if (!requestId || typeof requestId !== "string" || requestId.length > 100) {
      return { success: false, message: "Invalid request ID provided." };
    }

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

    const validated = updateRequestInternalNotesSchema.safeParse({
      requestId,
      internalNotes: internalNotes || "",
    });

    if (!validated.success) {
      const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0];
      return {
        success: false,
        message: firstError || "Invalid notes payload.",
      };
    }

    const updated = await updateRequestInternalNotes(
      validated.data.requestId,
      validated.data.internalNotes
    );
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
