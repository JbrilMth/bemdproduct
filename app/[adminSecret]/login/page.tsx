"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLoginAction } from "@/actions/auth";
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

import { useAdminPath } from "@/components/admin/AdminPathContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { basePath } = useAdminPath();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await adminLoginAction({ email, password });
    setLoading(false);

    if (res.success) {
      router.push(basePath || "/");
      router.refresh();
    } else {
      setErrorMsg(res.message || "Invalid credentials.");
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 border border-neutral-200 bg-white p-8 sm:p-10 shadow-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-neutral-900 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs text-neutral-500">
            Sign in to manage catalog products, categories, and customer sourcing requests.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sourcinghub.com"
                className="w-full rounded border border-neutral-300 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded border border-neutral-300 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded bg-neutral-900 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Sign In to Admin Dashboard</span>
            )}
          </button>
        </form>

        <div className="border border-neutral-100 bg-neutral-50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
            <ShieldCheck className="h-4 w-4 text-neutral-700" />
            <span>Authorized corporate personnel only. All access attempts are monitored.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
