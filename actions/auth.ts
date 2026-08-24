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
import { ActionResult } from "./requests";

export { getAdminSession, requireAdminSession };

export async function adminLoginAction(formData: unknown): Promise<ActionResult> {
  try {
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

    // Set signed secure cookie
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
      message: error.message || "Failed to log in.",
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
