import { getAdminSession, isValidAdminSecretPath } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Management Console Sign In | China Sourcing Hub",
  robots: { index: false, follow: false },
};

interface AdminLoginLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    adminSecret: string;
  }>;
}

export default async function AdminLoginLayout({
  children,
  params,
}: AdminLoginLayoutProps) {
  const { adminSecret } = await params;

  if (!isValidAdminSecretPath(adminSecret)) {
    notFound();
  }

  const session = await getAdminSession();
  if (session) {
    redirect(`/${adminSecret}`);
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
