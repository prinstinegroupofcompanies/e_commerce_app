"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** @param {{ refundId: string; status: string }} props */
export function AdminRefundActions({ refundId, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(nextStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/refunds/${refundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Update failed");
        setLoading(false);
        return;
      }
      toast.success("Refund updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  if (status === "completed" || status === "rejected") {
    return <span className="text-xs text-muted-foreground capitalize">{status}</span>;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status === "pending" ? (
        <>
          <Button size="sm" disabled={loading} onClick={() => update("approved")}>
            Approve
          </Button>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => update("rejected")}>
            Reject
          </Button>
        </>
      ) : null}
      {status === "approved" ? (
        <Button size="sm" disabled={loading} onClick={() => update("completed")}>
          Mark completed
        </Button>
      ) : null}
    </div>
  );
}
