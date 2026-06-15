"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";

export function SellerSettingsForm() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/seller/profile")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setProfile(j.data);
          setName(j.data.name || "");
          setPhone(j.data.phone || "");
          setAvatar(j.data.avatar || "");
        }
      });
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seller/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, avatar }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error || "Could not save");
      } else {
        toast.success("Profile updated");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function savePassword(e) {
    e.preventDefault();
    if (!current || !next) return;
    setSaving(true);
    try {
      const res = await fetch("/api/seller/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error || "Could not update password");
      } else {
        toast.success("Password updated");
        setCurrent("");
        setNext("");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  if (!profile) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (order SMS)</Label>
              <Input
                id="phone"
                placeholder="+231770000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">New order alerts are sent to this number when Twilio is configured.</p>
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <ImageUpload
                value={avatar || null}
                onChange={(url) => setAvatar(url || "")}
                folder="uploads/avatars"
                label="Upload avatar"
                shape="circle"
                size={80}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={savePassword}>
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next">New password</Label>
              <Input
                id="next"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
