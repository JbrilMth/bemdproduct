"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FolderTree,
  Inbox,
  Settings,
  Globe,
} from "lucide-react";
import { useAdminPath } from "@/components/admin/AdminPathContext";

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { basePath, path } = useAdminPath();

  const navGroups = [
    {
      title: "Core",
      items: [
        {
          name: "Dashboard",
          href: path(""),
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "Products",
      items: [
        {
          name: "All Products",
          href: path("/products"),
          icon: Package,
          exact: true,
        },
        {
          name: "Add Product",
          href: path("/products/new"),
          icon: PlusCircle,
          exact: true,
        },
      ],
    },
    {
      title: "Categories",
      items: [
        {
          name: "All Categories",
          href: path("/categories"),
          icon: FolderTree,
          exact: true,
        },
        {
          name: "Add Category",
          href: path("/categories/new"),
          icon: PlusCircle,
          exact: true,
        },
      ],
    },
    {
      title: "Inquiries",
      items: [
        {
          name: "All Requests",
          href: path("/requests"),
          icon: Inbox,
          exact: true,
        },
        {
          name: "New Requests",
          href: path("/requests?status=NEW"),
          icon: Inbox,
          exact: false,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          name: "Storage & Settings",
          href: path("/settings"),
          icon: Settings,
          exact: true,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-200">
        <Link href={basePath || "/"} className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-neutral-900 text-xs font-black tracking-wider text-white">
            CS
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-neutral-900 uppercase">
              China Sourcing
            </span>
            <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
              Admin Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {group.title}
            </span>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const itemBase = item.href.split("?")[0];
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(itemBase) && pathname !== basePath;
                
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name + item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded transition ${
                      isActive
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-neutral-200">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100 transition"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-neutral-400" />
            <span>Public Website</span>
          </div>
          <span className="text-[10px] text-neutral-400">&rarr;</span>
        </Link>
      </div>
    </aside>
  );
}
