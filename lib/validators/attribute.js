import { z } from "zod";

export const attributeCreateBodySchema = z.object({
  name: z.string().min(1).max(120),
  values: z.array(z.string().min(1).max(100)).optional().default([]),
});

export const attributeUpdateBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  values: z.array(z.string().min(1).max(100)).optional(),
});
