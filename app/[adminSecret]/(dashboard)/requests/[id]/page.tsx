import { notFound } from "next/navigation";
import { getRequestById } from "@/lib/db/requests";
import { RequestDetailClient } from "@/components/admin/RequestDetailClient";

interface RequestDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RequestDetailsPage({ params }: RequestDetailsPageProps) {
  const { id } = await params;
  const request = await getRequestById(id);

  if (!request) {
    notFound();
  }

  return <RequestDetailClient request={request} />;
}
