"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
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
 *   categoryId?: string;
 *   listHref: string;
 *   parentOptions: { id: string; label: string }[];
 *   initialValues: Record<string, unknown>;
 * }} props
 */
export function CategoryForm({ mode, categoryId, listHref, parentOptions, initialValues }) {
  const router = useRouter();
  const [slugManual, setSlugManual] = useState(mode === "edit");

  const { register, handleSubmit, setValue, reset, formState } = useForm({
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const nameField = register("name");
  const slugField = register("slug");

  async function onSubmit(values) {
    const payload = {
      name: String(values.name ?? "").trim(),
      slug: String(values.slug ?? "").trim(),
      parentId: values.parentId ? String(values.parentId) : null,
      image: values.image ? String(values.image).trim() : null,
      description: values.description ? String(values.description) : null,
      sortOrder: Number(values.sortOrder) || 0,
      isActive: Boolean(values.isActive),
    };

    try {
      if (mode === "create") {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.error || "Could not create");
          return;
        }
        toast.success("Category created");
        router.push(`${listHref.replace(/\/$/, "")}/${json.data.id}/edit`);
        router.refresh();
        return;
      }

      if (!categoryId) {
        toast.error("Missing id");
        return;
      }

      const res = await fetch(`/api/categories/${categoryId}`, {
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
          <CardTitle>Category</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name={nameField.name}
              ref={nameField.ref}
              onChange={nameField.onChange}
              onBlur={(e) => {
                nameField.onBlur(e);
                if (!slugManual) {
                  const n = e.target.value.trim();
                  if (n) setValue("slug", slugify(n));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name={slugField.name}
              ref={slugField.ref}
              onBlur={slugField.onBlur}
              onChange={(e) => {
                setSlugManual(true);
                slugField.onChange(e);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent</Label>
            <select id="parentId" className={selectClass} {...register("parentId")}>
              <option value="">— Top level —</option>
              {parentOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" {...register("image")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" className={cn(selectClass, "min-h-[100px] resize-y")} {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input id="sortOrder" type="number" min="0" {...register("sortOrder")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border" {...register("isActive")} />
            Active
          </label>
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
