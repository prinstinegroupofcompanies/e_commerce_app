import { z } from "zod";

const relId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && String(v).trim() !== "" ? String(v).trim() : null));

export const productVariantInputSchema = z.object({
  id: z.string().optional(),
  options: z.union([z.record(z.string(), z.string()), z.string()]),
  sku: z.string().max(120).optional().nullable(),
  price: z.number().nonnegative(),
  comparePrice: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  image: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

const productFieldsSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  sku: z.string().max(120).optional().nullable(),
  shortDescription: z.string().max(600).optional().nullable(),
  description: z.string().max(50000).optional().nullable(),
  categoryId: relId,
  brandId: relId,
  sellerId: relId,
  type: z.enum(["simple", "variable"]).default("simple"),
  price: z.number().nonnegative(),
  comparePrice: z.number().nonnegative().optional().nullable(),
  costPrice: z.number().nonnegative().optional().nullable(),
  thumbnail: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().max(2000)).optional().default([]),
  videoUrl: z.string().max(2000).optional().nullable(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  minPurchaseQty: z.number().int().min(1).default(1),
  maxPurchaseQty: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  condition: z.enum(["new", "used", "refurbished"]).default("new"),
  shippingType: z.enum(["flat", "profile", "free"]).default("flat"),
  shippingCost: z.number().nonnegative().optional().nullable(),
  cashOnDelivery: z.boolean().default(true),
  deliveryAvailable: z.boolean().default(true),
  codLocationType: z.enum(["everywhere", "custom"]).default("everywhere"),
  metaTitle: z.string().max(300).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(500).optional().nullable(),
  variants: z.array(productVariantInputSchema).optional(),
});

/** @param {z.infer<typeof productFieldsSchema>} data */
function refineProductData(data, ctx) {
  if (
    data.maxPurchaseQty != null &&
    data.minPurchaseQty != null &&
    data.maxPurchaseQty < data.minPurchaseQty
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max purchase quantity must be at least the minimum",
      path: ["maxPurchaseQty"],
    });
  }
  if (data.type === "variable" && data.variants?.length) {
    for (let i = 0; i < data.variants.length; i++) {
      const v = data.variants[i];
      const opts =
        typeof v.options === "string" ? v.options.trim() : Object.keys(v.options || {}).length;
      if (!opts) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each variant needs at least one option (e.g. size or color)",
          path: ["variants", i, "options"],
        });
      }
    }
  }
}

export const productCreateBodySchema = productFieldsSchema.superRefine(refineProductData);

export const productUpdateBodySchema = productFieldsSchema.partial().superRefine(refineProductData);
