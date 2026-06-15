"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * @param {{ orderId: string; alreadyConfirmed: boolean }}
 */
export function ConfirmDeliveryForm({ orderId, alreadyConfirmed }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  if (alreadyConfirmed) {
    return (
      <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        Delivery confirmed. Thank you!
      </p>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/confirm-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Invalid code");
        return;
      }
      toast.success("Delivery confirmed");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit delivery PIN from your receipt or SMS to confirm you received the order.
      </p>
      <div className="space-y-2">
        <Label htmlFor="delivery-otp">Delivery PIN</Label>
        <Input
          id="delivery-otp"
          inputMode="numeric"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <Button type="submit" disabled={busy || otp.length !== 6}>
        {busy ? "Confirming…" : "Confirm delivery"}
      </Button>
    </form>
  );
}
