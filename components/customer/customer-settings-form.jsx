"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";

export function CustomerSettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", avatar: "" });

  useEffect(() => {
    fetch("/api/customer/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setForm({
            name: json.data.name ?? "",
            email: json.data.email ?? "",
            phone: json.data.phone ?? "",
            avatar: json.data.avatar ?? "",
          });
        }
        setLoading(false);
      });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          avatar: form.avatar || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not save");
        setSaving(false);
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Avatar</Label>
            <ImageUpload
              value={form.avatar || null}
              onChange={(url) => setForm((f) => ({ ...f, avatar: url || "" }))}
              folder="uploads/avatars"
              label="Upload avatar"
              shape="circle"
              size={80}
            />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
          <div className="space-y-2">
            <Label>Phone (SMS alerts)</Label>
            <Input
              placeholder="+231770000000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Used for order and delivery SMS via Twilio (Liberia +231).
            </p>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
