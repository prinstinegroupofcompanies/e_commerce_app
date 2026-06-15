"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * @param {{ sellerId: string; verificationStatus: string }}
 */
export function AdminSellerVerify({ sellerId, verificationStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function verify(action) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed");
        return;
      }
      toast.success(action === "approve" ? "Store approved" : "Store rejected");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (verificationStatus === "approved") {
    return <p className="text-sm text-muted-foreground">Store verification: approved</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" disabled={busy} onClick={() => verify("approve")}>
        Approve store
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => verify("reject")}>
        Reject
      </Button>
    </div>
  );
}
