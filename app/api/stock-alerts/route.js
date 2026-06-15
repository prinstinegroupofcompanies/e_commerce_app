import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullish(),
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Provide a valid email and product", parsed.error.flatten().fieldErrors, 422);
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true, isActive: true },
    });
    if (!product || !product.isActive) return jsonError("Product not found", [], 404);

    const session = await auth();
    const customerId = session?.user?.role === "customer" ? session.user.id : null;

    try {
      const created = await prisma.stockAlert.create({
        data: {
          productId: parsed.data.productId,
          variantId: parsed.data.variantId || null,
          email: parsed.data.email,
          customerId,
        },
      });
      return jsonSuccess({ alert: created, subscribed: true });
    } catch (err) {
      if (err?.code === "P2002") {
        return jsonSuccess({ subscribed: true, alreadySubscribed: true });
      }
      throw err;
    }
  } catch (e) {
    console.error(e);
    return jsonError("Could not subscribe", [], 500);
  }
}
