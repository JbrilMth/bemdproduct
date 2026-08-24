"use client";

import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname || pathname === "/") return true;
  const publicPrefixes = [
    "/products",
    "/categories",
    "/services",
    "/sourcing-request",
    "/quote",
    "/privacy",
    "/terms",
  ];
  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function Footer() {
  const pathname = usePathname();
  if (!isPublicRoute(pathname)) return null;

  return (
    <footer className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950 text-neutral-300">
      {/* Subtle Ambient Glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-neutral-800/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-6">
          
          {/* Brand Logo & Identifier */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-full border border-neutral-800 bg-neutral-900/90 px-4 py-1.5 shadow-sm backdrop-blur-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black tracking-wider text-neutral-950">
                CS
              </span>
              <span className="text-xs font-bold tracking-wider text-white uppercase">
                China Sourcing Hub
              </span>
              <span className="h-3.5 w-px bg-neutral-700" />
              <span className="text-[10px] font-medium tracking-wide text-neutral-400">
                Export & Sourcing Desk
              </span>
            </div>
          </div>

          {/* Global Coverage Tag */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-400">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-neutral-300">
              <Globe2 className="h-3 w-3 text-neutral-400" />
              <span>Worldwide Overseas Export</span>
            </span>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <span className="text-neutral-400">
              North Africa & Africa &nbsp;·&nbsp; Europe &nbsp;·&nbsp; North America &nbsp;·&nbsp; Middle East &nbsp;·&nbsp; Asia
            </span>
          </div>

          {/* Elegant Divider */}
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent pt-1" />

          {/* Copyright & Slogan */}
          <div className="space-y-1 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} China Sourcing Hub. All rights reserved.</p>
            <p className="text-[11px] text-neutral-600">
              Direct factory procurement, manufacturing discovery & overseas trade operations.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
