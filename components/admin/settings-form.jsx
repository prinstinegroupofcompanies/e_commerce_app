"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * @param {{
 *   group: string;
 *   title: string;
 *   description?: string;
 *   fields: { key: string; label: string; type?: "text" | "number" | "email" | "url" | "textarea" | "checkbox"; placeholder?: string; default?: string }[];
 * }} props
 */
export function SettingsForm({ group, title, description, fields }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/settings?group=${encodeURIComponent(group)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const map = Object.fromEntries(json.data.map((s) => [s.key, s.value ?? ""]));
          setValues((prev) => ({
            ...prev,
            ...Object.fromEntries(fields.map((f) => [f.key, map[f.key] ?? f.default ?? ""])),
          }));
        }
        setLoading(false);
      });
  }, [group, fields]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { group, values };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not save");
        setSaving(false);
        return;
      }
      toast.success("Settings saved");
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {fields.map((f) => {
            const id = `setting-${f.key}`;
            if (f.type === "textarea") {
              return (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={id}>{f.label}</Label>
                  <textarea
                    id={id}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                </div>
              );
            }
            if (f.type === "checkbox") {
              return (
                <label key={f.key} htmlFor={id} className="flex items-center gap-2 text-sm">
                  <input
                    id={id}
                    type="checkbox"
                    checked={values[f.key] === "true"}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.checked ? "true" : "false" })}
                  />
                  {f.label}
                </label>
              );
            }
            return (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={id}>{f.label}</Label>
                <Input
                  id={id}
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              </div>
            );
          })}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
