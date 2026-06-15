import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { fireBackInStockAlerts } from "@/lib/stock-alerts";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("simple"),
    productId: z.string().min(1),
    stock: z.coerce.number().int().min(0),
  }),
  z.object({
    kind: z.literal("variant"),
    variantId: z.string().min(1),
    stock: z.coerce.number().int().min(0),
  }),
]);

export async function PATCH(request) {
  const gate = await requireSessionRoles(["seller"]);
  if (!gate.ok) return gate.response;

  const sellerId = gate.session.user.id;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", parsed.error.flatten().fieldErrors, 422);
  }

  if (parsed.data.kind === "simple") {
    const { productId, stock } = parsed.data;
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId, type: "simple" },
      select: { id: true, stockQuantity: true, isActive: true },
    });
    if (!product) return jsonError("Product not found", [], 404);

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: stock },
      select: { id: true, stockQuantity: true, lowStockThreshold: true },
    });

    if (product.stockQuantity <= 0 && stock > 0 && product.isActive) {
      fireBackInStockAlerts(product.id).catch((err) => console.error("[inventory-stock-alert]", err));
    }

    return jsonSuccess({
      kind: "simple",
      productId: updated.id,
      stock: updated.stockQuantity,
      low: updated.stockQuantity <= updated.lowStockThreshold,
    });
  }

  const { variantId, stock } = parsed.data;
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { sellerId } },
    select: { id: true, stock: true, productId: true, product: { select: { lowStockThreshold: true } } },
  });
  if (!variant) return jsonError("Variant not found", [], 404);

  const updated = await prisma.productVariant.update({
    where: { id: variant.id },
    data: { stock },
    select: { id: true, stock: true, productId: true },
  });

  const threshold = variant.product.lowStockThreshold;
  return jsonSuccess({
    kind: "variant",
    variantId: updated.id,
    productId: updated.productId,
    stock: updated.stock,
    low: updated.stock <= threshold,
  });
}
