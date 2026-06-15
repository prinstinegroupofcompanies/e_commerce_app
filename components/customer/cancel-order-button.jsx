"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** @param {{ orderId: string }} props */
export function CancelOrderButton({ orderId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onCancel() {
    if (!confirm("Cancel this order? Stock will be restored.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not cancel");
      } else {
        toast.success("Order cancelled");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onCancel}>
      {loading ? "Cancelling…" : "Cancel order"}
    </Button>
  );
}
