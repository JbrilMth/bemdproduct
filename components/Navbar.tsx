"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

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

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  if (!isPublicRoute(pathname)) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "New Products", href: "/products?isNew=true" },
    { name: "Trending", href: "/products?isTrending=true" },
    { name: "Sourcing", href: "/services" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/90 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-neutral-900 text-xs font-black tracking-wider text-white">
              CS
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-neutral-900">
                CHINA SOURCING
              </span>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium">
                Discovery Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs font-semibold tracking-wide uppercase transition ${
                    isActive
                      ? "text-neutral-900 border-b-2 border-neutral-900 pb-0.5"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Search & CTAs */}
        <div className="hidden lg:flex items-center gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-56 xl:w-64"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition"
            />
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-400" />
          </form>

          <Link
            href="/sourcing-request"
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
          >
            <span>Request a Product</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Navigation Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/sourcing-request"
            className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Request Sourcing
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-neutral-700 hover:bg-neutral-100 rounded focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
            <Link
              href="/sourcing-request"
              onClick={() => setIsOpen(false)}
              className="w-full text-center rounded bg-neutral-900 py-2.5 text-xs font-semibold text-white"
            >
              Request a Product
            </Link>
            <Link
              href="/quote"
              onClick={() => setIsOpen(false)}
              className="w-full text-center rounded border border-neutral-300 py-2.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Get Product Quotation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
