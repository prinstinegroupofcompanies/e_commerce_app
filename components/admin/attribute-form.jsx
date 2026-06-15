"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * @param {{
 *   mode: "create" | "edit";
 *   attributeId?: string;
 *   listHref: string;
 *   initialValues: Record<string, unknown>;
 * }} props
 */
export function AttributeForm({ mode, attributeId, listHref, initialValues }) {
  const router = useRouter();
  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  async function onSubmit(values) {
    const valuesList = String(values.valuesText ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload =
      mode === "create"
        ? { name: String(values.name ?? "").trim(), values: valuesList }
        : {
            name: String(values.name ?? "").trim(),
            values: valuesList,
          };

    try {
      if (mode === "create") {
        const res = await fetch("/api/attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.error || "Could not create");
          return;
        }
        toast.success("Attribute created");
        router.push(`${listHref.replace(/\/$/, "")}/${json.data.id}/edit`);
        router.refresh();
        return;
      }

      if (!attributeId) {
        toast.error("Missing id");
        return;
      }

      const res = await fetch(`/api/attributes/${attributeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Could not save");
        return;
      }
      toast.success("Saved");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(listHref)}>
          Back
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attribute</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (e.g. Color, Size)</Label>
            <Input id="name" {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valuesText">Values (one per line)</Label>
            <textarea
              id="valuesText"
              className={cn(selectClass, "min-h-[140px] font-mono text-xs")}
              {...register("valuesText")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  );
}
