"use client";

import { useState } from "react";
import { updateRequestStatusAction } from "@/actions/requests";
import { RequestStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";

interface RequestStatusSelectProps {
  requestId: string;
  initialStatus: RequestStatus;
}

export function RequestStatusSelect({
  requestId,
  initialStatus,
}: RequestStatusSelectProps) {
  const [status, setStatus] = useState<RequestStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: RequestStatus) => {
    setLoading(true);
    const res = await updateRequestStatusAction(requestId, newStatus);
    setLoading(false);
    if (res.success) {
      setStatus(newStatus);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        disabled={loading}
        value={status}
        onChange={(e) => handleChange(e.target.value as RequestStatus)}
        className={`rounded border px-2 py-1 text-[11px] font-semibold focus:outline-none bg-white ${
          status === "NEW"
            ? "border-neutral-900 text-neutral-900 font-bold bg-neutral-50"
            : status === "REVIEWING" || status === "PROCESSING"
            ? "border-neutral-400 text-neutral-800"
            : status === "COMPLETED"
            ? "border-neutral-300 text-neutral-600 bg-neutral-50"
            : "border-neutral-200 text-neutral-400"
        }`}
      >
        <option value="NEW">NEW</option>
        <option value="REVIEWING">REVIEWING</option>
        <option value="PROCESSING">PROCESSING</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
      {loading && <Loader2 className="h-3 w-3 animate-spin text-neutral-900" />}
    </div>
  );
}
