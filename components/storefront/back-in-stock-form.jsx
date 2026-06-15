"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * @param {{ productId: string; defaultEmail?: string }} props
 */
export function BackInStockForm({ productId, defaultEmail = "" }) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setDone(true);
      toast.success("We'll email you when it's back in stock");
    } catch (err) {
      toast.error(err?.message || "Could not subscribe");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <BellRing className="h-4 w-4" />
        <span>You&apos;re on the list. We&apos;ll email you when stock returns.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-primary/15 bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Bell className="h-4 w-4 text-primary" />
        Notify me when back in stock
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Saving…" : "Notify me"}
        </Button>
      </div>
    </form>
  );
}
