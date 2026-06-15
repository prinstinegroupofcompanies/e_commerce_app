import { z } from "zod";

export const registerCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
});
