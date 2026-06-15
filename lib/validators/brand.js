import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const brandCreateBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens"),
  logo: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const brandUpdateBodySchema = brandCreateBodySchema.partial();
