import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const relId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && String(v).trim() !== "" ? String(v).trim() : null));

export const categoryCreateBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens"),
  parentId: relId,
  image: z.string().max(2000).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const categoryUpdateBodySchema = categoryCreateBodySchema.partial();
