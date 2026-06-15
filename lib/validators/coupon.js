import { z } from "zod";

export const couponCreateBodySchema = z.object({
  code: z.string().min(2).max(40),
  title: z.string().min(1).max(200),
  discountType: z.enum(["percentage", "fixed"]),
  discount: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().nonnegative().default(0),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const couponUpdateBodySchema = couponCreateBodySchema.partial();
