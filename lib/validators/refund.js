import { z } from "zod";

export const refundPatchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "completed"]).optional(),
  adminNote: z.string().max(2000).optional().nullable(),
  refundMethod: z.string().max(100).optional().nullable(),
});

export const refundRequestSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3).max(2000),
  amount: z.coerce.number().positive().optional(),
});
