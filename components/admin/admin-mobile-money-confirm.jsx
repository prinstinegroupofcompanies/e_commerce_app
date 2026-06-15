"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminMobileMoneyConfirm() {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/payments/mobile-money/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed");
        return;
      }
      toast.success(`Payment confirmed for ${json.data?.orderCode || "order"}`);
      setReference("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={confirm} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="min-w-[240px] flex-1 space-y-2">
        <Label htmlFor="mm-ref">Mobile money reference</Label>
        <Input
          id="mm-ref"
          placeholder="MM-ORD-..."
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Confirming…" : "Confirm payment"}
      </Button>
    </form>
  );
}
