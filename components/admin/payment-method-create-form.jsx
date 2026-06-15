"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentMethodCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, displayName, isSandbox, isActive: false }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not save");
        setSaving(false);
        return;
      }
      toast.success("Payment method added");
      setName("");
      setDisplayName("");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Add method
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-md border bg-card p-3">
      <div className="space-y-1">
        <Label className="text-xs">Code</Label>
        <Input className="h-9 w-32" required value={name} onChange={(e) => setName(e.target.value)} placeholder="stripe" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Display name</Label>
        <Input className="h-9 w-48" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Stripe (cards)" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isSandbox} onChange={(e) => setIsSandbox(e.target.checked)} />
        Sandbox
      </label>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
