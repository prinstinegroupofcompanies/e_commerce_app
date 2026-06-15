"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildInlineFormPayload } from "@/lib/inline-form-payload";

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   type?: "text" | "number" | "email" | "url";
 *   required?: boolean;
 *   placeholder?: string;
 *   defaultValue?: string;
 *   omitIfEmpty?: boolean;
 *   emptyAsNull?: boolean;
 * }} Field
 *
 * @param {{
 *   endpoint: string;
 *   triggerLabel?: string;
 *   fields: Field[];
 *   extra?: Record<string, unknown>;
 *   payloadDefaults?: Record<string, unknown>;
 * }} props
 */
export function InlineCreateForm({
  endpoint,
  triggerLabel = "Add",
  fields,
  extra,
  payloadDefaults,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  function reset() {
    setValues(Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ""])));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildInlineFormPayload(values, {
        fields,
        extra,
        defaults: payloadDefaults,
      });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not save");
        setSaving(false);
        return;
      }
      toast.success("Created");
      reset();
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
        {triggerLabel}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-md border bg-card p-3">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label className="text-xs">{f.label}</Label>
          <Input
            className="h-9 w-44"
            type={f.type || "text"}
            required={f.required}
            placeholder={f.placeholder}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          />
        </div>
      ))}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
