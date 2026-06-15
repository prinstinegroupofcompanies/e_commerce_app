import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number(),
  quantity: z.coerce.number().int().positive(),
});

const schema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  items: z.array(itemSchema).min(1).max(50),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const { email, items } = parsed.data;
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const slim = items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    await prisma.cartAbandonmentLead.upsert({
      where: { email },
      create: {
        email,
        items: JSON.stringify(slim),
        subtotal,
        abandonmentReminderSentAt: null,
      },
      update: {
        items: JSON.stringify(slim),
        subtotal,
        abandonmentReminderSentAt: null,
      },
    });

    return jsonSuccess({ saved: true });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
