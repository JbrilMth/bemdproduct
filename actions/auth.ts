"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validations";
import {
  setAdminSessionCookie,
  clearAdminSessionCookie,
  getAdminSession,
  requireAdminSession,
} from "@/lib/auth";
import { adminLoginRateLimiter, getClientIp } from "@/lib/rate-limit";
import { ActionResult } from "./requests";

export { getAdminSession, requireAdminSession };

// Static pre-hashed dummy string for constant-time comparisons against non-existent accounts
const DUMMY_HASH = "$2a$10$e8w6i8Oqf0h6.Z5g0Y0a7.uM7Y7yM7yM7yM7yM7yM7yM7yM7yM7y";

export async function adminLoginAction(formData: unknown): Promise<ActionResult> {
  try {
    // 1. Enforce IP-based Rate Limiting (5 attempts / minute)
    const clientIp = await getClientIp();
    const rateCheck = adminLoginRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: `Too many failed login attempts. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`,
      };
    }

    // 2. Strict Input Validation
    const validated = adminLoginSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        message: "Invalid email or password format.",
      };
    }

    const { email, password } = validated.data;
    const user = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Execute constant-time bcrypt comparison to prevent username enumeration timing side-channels
      await bcrypt.compare(password, DUMMY_HASH);
      return {
        success: false,
        message: "Invalid administrator credentials.",
      };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        message: "Invalid administrator credentials.",
      };
    }

    const authorizedEmail = process.env.ADMIN_AUTHORIZED_EMAIL;
    if (authorizedEmail && user.email.toLowerCase() !== authorizedEmail.toLowerCase()) {
      return {
        success: false,
        message: "Invalid administrator credentials.",
      };
    }

    // 3. Reset rate limit counter upon successful authentication
    adminLoginRateLimiter.reset(clientIp);

    // 4. Set cryptographically signed HTTP-only session cookie
    await setAdminSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: { email: user.email, name: user.name },
    };
  } catch (error: any) {
    console.error("Admin login error:", error);
    return {
      success: false,
      message: "An unexpected error occurred during sign in. Please try again.",
    };
  }
}

export async function adminLogoutAction(): Promise<ActionResult> {
  try {
    await clearAdminSessionCookie();
    return {
      success: true,
      message: "Signed out successfully.",
    };
  } catch (error: any) {
    console.error("Admin logout error:", error);
    return {
      success: false,
      message: "Failed to log out.",
    };
  }
}
