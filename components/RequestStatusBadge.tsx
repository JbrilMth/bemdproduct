import type { RequestStatus } from "@prisma/client";
import { getRequestStatusBadgeClass } from "@/lib/utils";

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const badgeClass = getRequestStatusBadgeClass(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badgeClass}`}
    >
      {status}
    </span>
  );
}
