import { isR2Configured } from "@/lib/storage";
import { getAdminSession } from "@/actions/auth";
import { HardDrive, Shield, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSettingsPage() {
  const r2Active = isR2Configured();
  const session = await getAdminSession();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
          System Configuration
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
          Storage & Workspace Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Inspect object storage drivers, Cloudflare R2 credentials status, and administrator profile.
        </p>
      </div>

      {/* 1. Object Storage Status */}
      <div className="border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-5 w-5 text-neutral-900" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Object Storage Infrastructure
              </h3>
              <p className="text-xs text-neutral-500">
                Image upload destination for products, categories, and customer sourcing references.
              </p>
            </div>
          </div>

          <div>
            {r2Active ? (
              <span className="inline-flex items-center gap-1 bg-neutral-900 text-white px-2.5 py-1 text-xs font-semibold rounded">
                <CheckCircle2 className="h-3.5 w-3.5" /> Cloudflare R2 Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2.5 py-1 text-xs font-semibold rounded">
                <HardDrive className="h-3.5 w-3.5 text-neutral-600" /> Local Object Storage (Dev Mode)
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-neutral-600 space-y-3 leading-relaxed">
          <p>
            {r2Active
              ? "All uploaded images are directly transmitted and stored in your Cloudflare R2 S3-compatible bucket. Neon PostgreSQL only stores delivery URLs and metadata references."
              : "The system is currently running in local storage fallback mode (saving image assets to /public/uploads/ with unique generated keys). Real drag-and-drop file uploads are fully functional."}
          </p>

          <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-2 font-mono text-[11px]">
            <span className="font-bold text-neutral-800 uppercase block font-sans text-xs">
              Cloudflare R2 Environment Variables:
            </span>
            <div className="space-y-1 text-neutral-600">
              <div>
                R2_ACCOUNT_ID={process.env.R2_ACCOUNT_ID ? "••••••••" : "[Not configured]"}
              </div>
              <div>
                R2_ACCESS_KEY_ID={process.env.R2_ACCESS_KEY_ID ? "••••••••" : "[Not configured]"}
              </div>
              <div>
                R2_SECRET_ACCESS_KEY={process.env.R2_SECRET_ACCESS_KEY ? "••••••••" : "[Not configured]"}
              </div>
              <div>
                R2_BUCKET_NAME={process.env.R2_BUCKET_NAME || "[Not configured]"}
              </div>
              <div>
                R2_PUBLIC_URL={process.env.R2_PUBLIC_URL || "[Not configured]"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Admin Account */}
      <div className="border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
          <Shield className="h-5 w-5 text-neutral-900" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Administrator Profile & Security
            </h3>
            <p className="text-xs text-neutral-500">
              Authenticated trading desk session details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="border border-neutral-100 bg-neutral-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Active Administrator
            </span>
            <span className="font-bold text-neutral-900 text-sm block mt-0.5">
              {session?.name || "Administrator"}
            </span>
          </div>

          <div className="border border-neutral-100 bg-neutral-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Session Email
            </span>
            <span className="font-semibold text-neutral-800 font-mono block mt-0.5">
              {session?.email || "admin@sourcinghub.com"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
