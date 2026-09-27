"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminPath } from "@/components/admin/AdminPathContext";
import { changePasswordAction } from "@/actions/settings";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react";

export function ChangePasswordForm() {
  const router = useRouter();
  const { basePath } = useAdminPath();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side quick checks for better UX
    if (!currentPassword) {
      setErrorMsg("Current password is required.");
      return;
    }
    if (newPassword.length < 15) {
      setErrorMsg("New password must be at least 15 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message || "Password changed successfully. Please sign in again.");
        // Clear sensitive inputs from component state
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Immediate redirect to login with confirmation parameter
        const loginUrl = `${basePath}/login?message=${encodeURIComponent(
          "Password changed successfully. Please sign in again."
        )}`;

        setTimeout(() => {
          router.push(loginUrl);
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(res.message || "Failed to change password. Please check your credentials.");
        setLoading(false);
      }
    } catch {
      setErrorMsg("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* 1. Current Password */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1"
          >
            Current Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter your current password"
              className="w-full rounded border border-neutral-300 bg-white py-2 pl-9 pr-10 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 focus:outline-none"
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 2. New Password */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1"
          >
            New Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              placeholder="Minimum 15 characters"
              className="w-full rounded border border-neutral-300 bg-white py-2 pl-9 pr-10 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 focus:outline-none"
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Minimum 15 characters, maximum 72 bytes. Spaces, Unicode, and special characters permitted.
          </p>
        </div>

        {/* 3. Confirm New Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Re-enter your new password"
              className="w-full rounded border border-neutral-300 bg-white py-2 pl-9 pr-10 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 focus:outline-none"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 4. Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <span>Change Password</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
