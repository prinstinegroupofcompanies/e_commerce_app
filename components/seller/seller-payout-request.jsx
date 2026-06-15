"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** @param {{ walletBalance: number; minPayout: number }} props */
export function SellerPayoutRequest({ walletBalance, minPayout }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seller/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method, notes: notes || null }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error || "Could not submit");
      } else {
        toast.success("Payout request submitted");
        setAmount("");
        setNotes("");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request a payout</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Available balance: <span className="font-medium text-foreground">${walletBalance.toFixed(2)}</span> · Minimum:
          ${minPayout.toFixed(2)}
        </p>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={minPayout}
              max={walletBalance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Method</Label>
            <select
              id="method"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="bank">Bank transfer</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="wire">Wire</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving || walletBalance < minPayout}>
              {saving ? "Submitting…" : "Request payout"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
