import { getAdminSession, isValidAdminSecretPath } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminProtectedLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    adminSecret: string;
  }>;
}

export default async function AdminProtectedLayout({
  children,
  params,
}: AdminProtectedLayoutProps) {
  const { adminSecret } = await params;

  if (!isValidAdminSecretPath(adminSecret)) {
    notFound();
  }

  const session = await getAdminSession();
  if (!session) {
    redirect(`/${adminSecret}/login`);
  }

  return (
    <AdminLayoutClient adminName={session.name}>
      {children}
    </AdminLayoutClient>
  );
}
