"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ORDER_OPTIONS = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_OPTIONS = ["pending", "paid", "failed", "refunded"];

/**
 * @param {{
 *   orderId: string;
 *   initialOrderStatus: string;
 *   initialPaymentStatus: string;
 *   initialTrackingId: string | null;
 * }} props
 */
export function AdminOrderStatusForm({ orderId, initialOrderStatus, initialPaymentStatus, initialTrackingId }) {
  const router = useRouter();
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [trackingId, setTrackingId] = useState(initialTrackingId ?? "");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus,
          paymentStatus,
          trackingId: trackingId.trim() || null,
          comment: comment.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Update failed");
        setLoading(false);
        return;
      }
      toast.success("Order updated");
      setComment("");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Update order</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="order-status">Order status</Label>
          <select
            id="order-status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
          >
            {ORDER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pay-status">Payment status</Label>
          <select
            id="pay-status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            {PAYMENT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="track">Tracking ID</Label>
        <Input id="track" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="Carrier tracking number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hist-comment">Note (appears on timeline)</Label>
        <Input id="hist-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional message for customer-facing history" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
