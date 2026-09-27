"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, clearAdminSessionCookie } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";
import { passwordChangeRateLimiter, getClientIp } from "@/lib/rate-limit";
import { ActionResult } from "./requests";

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Protected Server Action to securely change an authenticated administrator's password.
 * Strictly uses authenticated session identity and enforces rate limiting, bcrypt byte boundaries,
 * password strength validation, sessionVersion incrementation, and session cookie clearance.
 */
export async function changePasswordAction(formData: unknown): Promise<ActionResult> {
  try {
    // 1. Strictly require authenticated admin session
    const session = await requireAdminSession();

    // 2. Enforce Rate Limiting (5 attempts / 15 minutes per admin + IP)
    const clientIp = await getClientIp();
    const rateLimitKey = `${session.id}:${clientIp}`;
    const rateCheck = passwordChangeRateLimiter.check(rateLimitKey);
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: "Too many attempts. Please try again later.",
      };
    }

    // 3. Strict Input Validation via Zod Schema
    const parsed = changePasswordSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed.";
      return {
        success: false,
        message: firstError,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { currentPassword, newPassword } = parsed.data;

    // 4. Fetch the authenticated AdminUser from database
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!admin) {
      return {
        success: false,
        message: "Unauthorized: Administrator account not found.",
      };
    }

    // 5. Verify CURRENT password using bcrypt.compare
    const isCurrentValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      return {
        success: false,
        message: "Current password is incorrect.",
      };
    }

    // 6. Ensure NEW password is not the same as the current password
    const isSameAsCurrent = await bcrypt.compare(newPassword, admin.passwordHash);
    if (isSameAsCurrent) {
      return {
        success: false,
        message: "New password must be different from your current password.",
      };
    }

    // 7. Hash the new password using application standard cost factor
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // 8. Atomically update passwordHash and increment sessionVersion
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        sessionVersion: {
          increment: 1,
        },
      },
    });

    // 9. Safe audit log (no passwords or hashes logged)
    console.info(
      `[SECURITY EVENT] ADMIN_PASSWORD_CHANGED: adminId=${admin.id} timestamp=${new Date().toISOString()}`
    );

    // 10. Clear current admin session cookie
    await clearAdminSessionCookie();

    // 11. Reset rate limit counter on successful password change
    passwordChangeRateLimiter.reset(rateLimitKey);

    return {
      success: true,
      message: "Password changed successfully. Please sign in again.",
    };
  } catch (error: any) {
    if (error?.message?.includes("Unauthorized") || error?.message?.includes("Forbidden")) {
      return {
        success: false,
        message: "Unauthorized: Administrator authentication required.",
      };
    }

    console.error("Change password error:", error?.message || "Unknown error");
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
