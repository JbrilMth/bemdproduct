import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidAdminSecretPath } from "@/lib/auth";
import { AdminPathProvider } from "@/components/admin/AdminPathContext";

export const metadata: Metadata = {
  title: "Management Console | China Sourcing Hub",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminRootLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    adminSecret: string;
  }>;
}

export default async function AdminRootLayout({
  children,
  params,
}: AdminRootLayoutProps) {
  const { adminSecret } = await params;

  // Mask invalid paths as standard 404
  if (!isValidAdminSecretPath(adminSecret)) {
    notFound();
  }

  const basePath = `/${adminSecret}`;

  return (
    <AdminPathProvider basePath={basePath}>
      <div className="min-h-screen bg-neutral-100 text-neutral-900">{children}</div>
    </AdminPathProvider>
  );
}
