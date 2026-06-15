"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BroadcastForm() {
  const router = useRouter();
  const [audience, setAudience] = useState("all-customers");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("info");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, title, message, type, link: link || null }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not send");
        setSaving(false);
        return;
      }
      toast.success(`Sent to ${json.data.delivered} recipient(s)`);
      setTitle("");
      setMessage("");
      setLink("");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Broadcast notification</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Audience</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="all-customers">All customers</option>
                <option value="all-sellers">All sellers</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={2000}
            />
          </div>
          <div className="space-y-2">
            <Label>Link (optional)</Label>
            <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Sending…" : "Send broadcast"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
