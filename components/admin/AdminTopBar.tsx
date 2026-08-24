"use client";

import { adminLogoutAction } from "@/actions/auth";
import { LogOut, Menu } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { useAdminPath } from "@/components/admin/AdminPathContext";

interface AdminTopBarProps {
  adminName?: string;
  onOpenMobile?: () => void;
}

export function AdminTopBar({
  adminName = "Administrator",
  onOpenMobile,
}: AdminTopBarProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { path } = useAdminPath();

  const handleLogout = () => {
    startTransition(async () => {
      await adminLogoutAction();
      router.push(path("/login"));
      router.refresh();
    });
  };

  return (
    <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-4 sm:px-8 select-none">
      {/* Mobile Toggle & Left Label */}
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            type="button"
            onClick={onOpenMobile}
            className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <span>China Trading Desk</span>
          <span>/</span>
          <span className="text-neutral-900 font-bold">Management Console</span>
        </div>
      </div>

      {/* Admin Profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white uppercase">
            {adminName.charAt(0)}
          </div>
          <span className="text-xs font-bold text-neutral-900 hidden sm:inline">
            {adminName}
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-200" />

        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 px-2.5 py-1.5 rounded transition disabled:opacity-50"
          title="Sign out of admin workspace"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
