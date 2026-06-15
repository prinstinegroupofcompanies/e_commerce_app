"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * @param {{ companyId: string }}
 */
export function AdminDeliveryVerify({ companyId }) {
  const router = useRouter();

  async function verify(action) {
    const res = await fetch(`/api/admin/delivery-companies/${companyId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || "Failed");
      return;
    }
    toast.success(action === "approve" ? "Company approved" : "Rejected");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" type="button" onClick={() => verify("approve")}>
        Approve
      </Button>
      <Button size="sm" variant="outline" type="button" onClick={() => verify("reject")}>
        Reject
      </Button>
    </div>
  );
}
