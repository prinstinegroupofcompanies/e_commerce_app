"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart-store";

const STORAGE_KEY = "mh_cart_reminder_email";

export function CartGuestReminder() {
  const { data: session, status } = useSession();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const isGuest = status !== "loading" && session?.user?.role !== "customer";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setEmail(stored);
  }, []);

  useEffect(() => {
    if (!isGuest || items.length === 0 || !email || saved) return;
    const t = setTimeout(() => {
      syncLead(email, items, subtotal, false);
    }, 2000);
    return () => clearTimeout(t);
  }, [email, items, isGuest, saved, subtotal]);

  if (!isGuest || items.length === 0) return null;

  async function syncLead(targetEmail, cartItems, cartSubtotal, showToast) {
    setLoading(true);
    try {
      const res = await fetch("/api/cart/guest-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          items: cartItems.map((line) => ({
            productId: line.productId,
            name: line.name,
            price: line.price,
            quantity: line.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (showToast) toast.error(json.error || "Could not save reminder");
        return;
      }
      localStorage.setItem(STORAGE_KEY, targetEmail);
      setSaved(true);
      if (showToast) toast.success("We'll email you a cart reminder if you leave.");
    } catch {
      if (showToast) toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    if (!email.trim()) return;
    await syncLead(email.trim(), items, subtotal, true);
  }

  if (saved) {
    return (
      <p className="text-xs text-muted-foreground">
        Reminder enabled for <span className="font-medium text-foreground">{email}</span>.
      </p>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-2 rounded-lg border border-dashed border-primary/20 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">Get a reminder if you leave items behind (guest checkout).</p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 flex-1 text-sm"
          required
        />
        <Button type="submit" size="sm" variant="secondary" disabled={loading}>
          {loading ? "…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
