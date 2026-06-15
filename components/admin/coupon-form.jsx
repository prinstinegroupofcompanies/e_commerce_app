"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * @param {{
 *   mode: "create" | "edit";
 *   couponId?: string;
 *   listHref: string;
 *   initialValues: Record<string, unknown>;
 * }} props
 */
export function CouponForm({ mode, couponId, listHref, initialValues }) {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm({ defaultValues: initialValues });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  async function onSubmit(values) {
    const payload = {
      code: String(values.code ?? "").trim(),
      title: String(values.title ?? "").trim(),
      discountType: values.discountType === "fixed" ? "fixed" : "percentage",
      discount: Number(values.discount),
      minOrderAmount: Number(values.minOrderAmount) || 0,
      maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : null,
      usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
      perUserLimit: Number(values.perUserLimit) || 1,
      startsAt: values.startsAt ? new Date(String(values.startsAt)).toISOString() : null,
      expiresAt: values.expiresAt ? new Date(String(values.expiresAt)).toISOString() : null,
      isActive: Boolean(values.isActive),
    };

    try {
      if (mode === "create") {
        const res = await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.error || "Could not create");
          return;
        }
        toast.success("Coupon created");
        router.push(`${listHref.replace(/\/$/, "")}/${json.data.id}/edit`);
        router.refresh();
        return;
      }

      if (!couponId) {
        toast.error("Missing id");
        return;
      }

      const res = await fetch(`/api/coupons/${couponId}`, {
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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === "create" ? "New coupon" : "Edit coupon"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" {...register("code")} placeholder="SAVE10" className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discountType">Type</Label>
              <select
                id="discountType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                {...register("discountType")}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount value</Label>
              <Input id="discount" type="number" step="0.01" {...register("discount")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Min order ($)</Label>
              <Input id="minOrderAmount" type="number" step="0.01" {...register("minOrderAmount")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDiscount">Max discount ($)</Label>
              <Input id="maxDiscount" type="number" step="0.01" {...register("maxDiscount")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage limit</Label>
              <Input id="usageLimit" type="number" {...register("usageLimit")} placeholder="Unlimited" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perUserLimit">Per user limit</Label>
              <Input id="perUserLimit" type="number" {...register("perUserLimit")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Starts at</Label>
              <Input id="startsAt" type="datetime-local" {...register("startsAt")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires at</Label>
              <Input id="expiresAt" type="datetime-local" {...register("expiresAt")} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} className="rounded border-input" />
            Active
          </label>
          <div className="flex gap-2">
            <Button type="submit">{mode === "create" ? "Create" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push(listHref)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
