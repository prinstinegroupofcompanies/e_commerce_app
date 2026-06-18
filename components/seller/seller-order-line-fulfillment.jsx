"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDeliveryStatus } from "@/lib/order-labels";

const DELIVERY = [
  "pending",
  "order_confirmed",
  "preparing",
  "waiting_pickup",
  "picked_up",
  "out_for_delivery",
  "on_the_way",
  "arrived",
  "delivered",
  "shipped",
];

/**
 * @param {{
 *   itemId: string;
 *   initialDeliveryStatus: string;
 *   initialTrackingId: string | null;
 *   orderCancelled: boolean;
 * }} props
 */
export function SellerOrderLineFulfillment({ itemId, initialDeliveryStatus, initialTrackingId, orderCancelled }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialDeliveryStatus);
  const [trackingId, setTrackingId] = useState(initialTrackingId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (orderCancelled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryStatus: status,
          trackingId: trackingId.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Update failed");
        setLoading(false);
        return;
      }
      toast.success("Fulfillment saved");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 space-y-1">
        <Label htmlFor={`d-${itemId}`} className="text-xs text-muted-foreground">
          Status
        </Label>
        <select
          id={`d-${itemId}`}
          disabled={orderCancelled}
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {DELIVERY.map((s) => (
            <option key={s} value={s}>
              {formatDeliveryStatus(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-[2] space-y-1">
        <Label htmlFor={`t-${itemId}`} className="text-xs text-muted-foreground">
          Tracking (optional)
        </Label>
        <Input
          id={`t-${itemId}`}
          disabled={orderCancelled}
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Carrier tracking #"
          className="h-9"
        />
      </div>
      <Button type="submit" size="sm" className="shrink-0 sm:mb-0.5" disabled={loading || orderCancelled}>
        {loading ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
