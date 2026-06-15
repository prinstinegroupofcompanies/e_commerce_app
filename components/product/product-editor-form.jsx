"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { productCreateBodySchema, productUpdateBodySchema } from "@/lib/validators/product";
import { slugify } from "@/lib/slug";
import { formatVariantOptions } from "@/lib/variant-options";
import { defaultProductFormValues, emptyVariantRow } from "@/lib/product-form-defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * @param {Record<string, unknown>} values
 */
function toApiPayload(values) {
  const imageUrls = Array.isArray(values.imageUrls) ? values.imageUrls.filter(Boolean) : [];
  const thumbnail = imageUrls[0] || (values.thumbnail ? String(values.thumbnail).trim() : null);

  const num = (v, fallback = 0) => {
    if (v === "" || v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const numOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const type = values.type === "variable" ? "variable" : "simple";
  const basePrice = num(values.price, 0);

  /** @type {import("@/lib/validators/product").productVariantInputSchema._type[] | undefined} */
  let variants;
  if (type === "variable" && Array.isArray(values.variantsRows)) {
    variants = values.variantsRows
      .filter((row) => row && (row.size || row.color))
      .map((row) => {
        const options = {};
        if (row.size) options.Size = String(row.size).trim();
        if (row.color) options.Color = String(row.color).trim();
        return {
          options: formatVariantOptions(options),
          sku: row.sku ? String(row.sku).trim() : null,
          price: num(row.price, basePrice),
          stock: Math.floor(num(row.stock, 0)),
          isActive: true,
        };
      });
  }

  return {
    name: String(values.name ?? "").trim(),
    slug: String(values.slug ?? "").trim(),
    sku: values.sku ? String(values.sku).trim() : null,
    shortDescription: values.shortDescription ? String(values.shortDescription) : null,
    description: values.description ? String(values.description) : null,
    categoryId: values.categoryId ? String(values.categoryId) : null,
    brandId: values.brandId ? String(values.brandId) : null,
    sellerId: values.sellerId ? String(values.sellerId) : null,
    type,
    price: basePrice,
    comparePrice: numOrNull(values.comparePrice),
    costPrice: numOrNull(values.costPrice),
    thumbnail,
    images: imageUrls,
    videoUrl: values.videoUrl ? String(values.videoUrl).trim() : null,
    stockQuantity: Math.floor(num(values.stockQuantity, 0)),
    lowStockThreshold: Math.floor(num(values.lowStockThreshold, 5)),
    minPurchaseQty: Math.floor(num(values.minPurchaseQty, 1)),
    maxPurchaseQty:
      values.maxPurchaseQty === "" || values.maxPurchaseQty === null || values.maxPurchaseQty === undefined
        ? null
        : (() => {
            const n = Math.floor(Number(values.maxPurchaseQty));
            return Number.isFinite(n) ? n : null;
          })(),
    isActive: Boolean(values.isActive),
    isFeatured: Boolean(values.isFeatured),
    condition: values.condition === "used" || values.condition === "refurbished" ? values.condition : "new",
    shippingType: values.shippingType === "profile" || values.shippingType === "free" ? values.shippingType : "flat",
    shippingCost: numOrNull(values.shippingCost),
    cashOnDelivery: Boolean(values.cashOnDelivery),
    deliveryAvailable: Boolean(values.deliveryAvailable),
    codLocationType: values.codLocationType === "custom" ? "custom" : "everywhere",
    metaTitle: values.metaTitle ? String(values.metaTitle) : null,
    metaDescription: values.metaDescription ? String(values.metaDescription) : null,
    metaKeywords: values.metaKeywords ? String(values.metaKeywords) : null,
    variants,
  };
}

/**
 * @param {{
 *   mode: "create" | "edit";
 *   productId?: string;
 *   isAdmin: boolean;
 *   listHref: string;
 *   categories: { id: string; name: string }[];
 *   brands: { id: string; name: string }[];
 *   sellers?: { id: string; shopName: string }[];
 *   initialValues?: Record<string, unknown>;
 * }} props
 */
export function ProductEditorForm({
  mode,
  productId,
  isAdmin,
  listHref,
  categories,
  brands,
  sellers = [],
  initialValues,
}) {
  const router = useRouter();
  const [slugManual, setSlugManual] = useState(mode === "edit");

  const { register, handleSubmit, setValue, reset, control, formState } = useForm({
    defaultValues: initialValues ?? defaultProductFormValues(),
  });

  const productType = useWatch({ control, name: "type" });
  const imageUrls = useWatch({ control, name: "imageUrls" }) ?? [];
  const variantsRows = useWatch({ control, name: "variantsRows" }) ?? [];

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const nameField = register("name");
  const slugField = register("slug");

  async function onSubmit(values) {
    const payload = toApiPayload(values);

    if (!payload.slug && payload.name) {
      payload.slug = slugify(payload.name);
    }

    if (!payload.slug) {
      toast.error("Product name or slug is required");
      return;
    }

    if (isAdmin && mode === "create" && !payload.sellerId) {
      toast.error("Please select a seller for this product");
      return;
    }

    if (payload.type === "variable") {
      if (!payload.variants?.length) {
        toast.error("Add at least one variant with a size or color");
        return;
      }
    } else {
      delete payload.variants;
    }

    if (!isAdmin) {
      delete payload.sellerId;
    }

    const parsed =
      mode === "create"
        ? productCreateBodySchema.safeParse(payload)
        : productUpdateBodySchema.safeParse(payload);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first = Object.values(flat.fieldErrors)[0]?.[0] ?? parsed.error.issues[0]?.message ?? "Validation failed";
      toast.error(first);
      return;
    }

    try {
      if (mode === "create") {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          const err = json.error;
          toast.error(typeof err === "string" ? err : json.message || "Could not create product");
          return;
        }
        toast.success("Product created");
        router.push(`${listHref.replace(/\/$/, "")}/${json.data.id}/edit`);
        router.refresh();
        return;
      }

      if (!productId) {
        toast.error("Missing product id");
        return;
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const err = json.error;
        toast.error(typeof err === "string" ? err : json.message || "Could not save");
        return;
      }
      toast.success("Saved");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  }

  function updateVariantRow(index, field, value) {
    const rows = [...(variantsRows || [])];
    rows[index] = { ...rows[index], [field]: value };
    setValue("variantsRows", rows);
  }

  function addVariantRow() {
    setValue("variantsRows", [...(variantsRows || []), emptyVariantRow()]);
  }

  function removeVariantRow(index) {
    const rows = (variantsRows || []).filter((_, i) => i !== index);
    setValue("variantsRows", rows.length ? rows : [emptyVariantRow()]);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(listHref)}>
          Back to list
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="name">Name *</Label>
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
            <Label htmlFor="slug">Slug *</Label>
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
            <p className="text-xs text-muted-foreground">URL segment: lowercase letters, numbers, hyphens.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register("sku")} />
          </div>
          {isAdmin && (
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="sellerId">
                Seller {mode === "create" ? "*" : ""}
              </Label>
              <select
                id="sellerId"
                className={selectClass}
                {...register("sellerId", { required: isAdmin && mode === "create" })}
              >
                <option value="">{mode === "create" ? "Select seller…" : "No seller"}</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <select id="categoryId" className={selectClass} {...register("categoryId")}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandId">Brand</Label>
            <select id="brandId" className={selectClass} {...register("brandId")}>
              <option value="">None</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" className={selectClass} {...register("type")}>
              <option value="simple">Simple</option>
              <option value="variable">Variable (sizes / colors)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <select id="condition" className={selectClass} {...register("condition")}>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Base price *</Label>
            <Input id="price" type="number" inputMode="decimal" step="0.01" min="0" {...register("price")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comparePrice">Compare at price</Label>
            <Input id="comparePrice" type="number" inputMode="decimal" step="0.01" min="0" {...register("comparePrice")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost price</Label>
            <Input id="costPrice" type="number" inputMode="decimal" step="0.01" min="0" {...register("costPrice")} />
          </div>
          {productType !== "variable" ? (
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock quantity</Label>
              <Input id="stockQuantity" type="number" inputMode="numeric" min="0" {...register("stockQuantity")} />
            </div>
          ) : (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              Stock is calculated from variant rows below.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
            <Input id="lowStockThreshold" type="number" inputMode="numeric" min="0" {...register("lowStockThreshold")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minPurchaseQty">Min purchase qty</Label>
            <Input id="minPurchaseQty" type="number" inputMode="numeric" min="1" {...register("minPurchaseQty")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPurchaseQty">Max purchase qty</Label>
            <Input id="maxPurchaseQty" type="number" inputMode="numeric" min="1" {...register("maxPurchaseQty")} />
          </div>
        </CardContent>
      </Card>

      {productType === "variable" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Variants (sizes & colors)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariantRow}>
              <Plus className="mr-1 h-4 w-4" />
              Add variant
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add a row for each combination (e.g. Size S + Color Red). At least size or color is required per row.
            </p>
            {(variantsRows || []).map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-border/80 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-6"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input
                    placeholder="S, M, L…"
                    value={row?.size ?? ""}
                    onChange={(e) => updateVariantRow(index, "size", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <Input
                    placeholder="Red, Blue…"
                    value={row?.color ?? ""}
                    onChange={(e) => updateVariantRow(index, "color", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row?.price ?? ""}
                    onChange={(e) => updateVariantRow(index, "price", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={row?.stock ?? ""}
                    onChange={(e) => updateVariantRow(index, "stock", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={row?.sku ?? ""}
                    onChange={(e) => updateVariantRow(index, "sku", e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeVariantRow(index)}
                    disabled={(variantsRows || []).length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Content & media</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short description</Label>
            <textarea
              id="shortDescription"
              className={cn(selectClass, "min-h-[72px] resize-y")}
              {...register("shortDescription")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" className={cn(selectClass, "min-h-[120px] resize-y")} {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Product images</Label>
            <MultiImageUpload
              value={imageUrls}
              onChange={(urls) => setValue("imageUrls", urls)}
              folder="products"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input id="videoUrl" {...register("videoUrl")} placeholder="https://…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping & visibility</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shippingType">Shipping type</Label>
            <select id="shippingType" className={selectClass} {...register("shippingType")}>
              <option value="flat">Flat rate</option>
              <option value="free">Free shipping</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingCost">Shipping cost</Label>
            <Input id="shippingCost" type="number" inputMode="decimal" step="0.01" min="0" {...register("shippingCost")} />
          </div>
          <label className="flex items-center gap-2 pt-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border" {...register("deliveryAvailable")} />
            Available for home delivery
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border" {...register("cashOnDelivery")} />
            Cash on delivery
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border" {...register("isActive")} />
            Active (visible in catalog)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border" {...register("isFeatured")} />
            Featured on homepage
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input id="metaTitle" {...register("metaTitle")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta description</Label>
            <textarea id="metaDescription" className={cn(selectClass, "min-h-[72px] resize-y")} {...register("metaDescription")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaKeywords">Meta keywords</Label>
            <Input id="metaKeywords" {...register("metaKeywords")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
