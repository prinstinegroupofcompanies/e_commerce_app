"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * @param {{ orderId: string; sellerOrderStatus: string; canHandover: boolean }}
 */
export function SellerOrderActions({ orderId, sellerOrderStatus, canHandover }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function respond(action) {
    setBusy(action);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not update order");
        return;
      }
      toast.success(action === "accept" ? "Order accepted" : "Order rejected");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy("");
    }
  }

  async function handover() {
    setBusy("handover");
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/handover`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Handover failed");
        return;
      }
      toast.success("Sent to delivery company");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy("");
    }
  }

  async function setPreparing() {
    setBusy("preparing");
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) return;
      router.refresh();
      toast.success("Marked as preparing");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card>
      <CardHeader className="border-b bg-muted/40 py-4">
        <CardTitle className="text-base">Store actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 p-5">
        {sellerOrderStatus === "pending" ? (
          <>
            <Button type="button" disabled={!!busy} onClick={() => respond("accept")}>
              {busy === "accept" ? "…" : "Accept order"}
            </Button>
            <Button type="button" variant="outline" disabled={!!busy} onClick={() => respond("reject")}>
              {busy === "reject" ? "…" : "Reject order"}
            </Button>
          </>
        ) : null}
        {sellerOrderStatus === "accepted" ? (
          <Button type="button" variant="secondary" disabled={!!busy} onClick={setPreparing}>
            Mark preparing
          </Button>
        ) : null}
        {canHandover ? (
          <Button type="button" className="bg-primary" disabled={!!busy} onClick={handover}>
            {busy === "handover" ? "…" : "Hand over to delivery"}
          </Button>
        ) : null}
        {sellerOrderStatus === "rejected" ? (
          <p className="text-sm text-muted-foreground">You rejected this order.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
