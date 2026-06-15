import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

const addSchema = z.object({
  productId: z.string().min(1),
});

export async function GET() {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;

  const items = await prisma.wishlist.findMany({
    where: { customerId: gate.session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          thumbnail: true,
          isActive: true,
        },
      },
    },
  });

  return jsonSuccess(items);
}

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["customer"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, ...catalogProductVisibilityWhere() },
      select: { id: true },
    });
    if (!product) return jsonError("Product not found", [], 404);

    const item = await prisma.wishlist.upsert({
      where: {
        customerId_productId: {
          customerId: gate.session.user.id,
          productId: product.id,
        },
      },
      create: {
        customerId: gate.session.user.id,
        productId: product.id,
      },
      update: {},
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, thumbnail: true },
        },
      },
    });

    return jsonSuccess(item, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function DELETE(request) {
  try {
    const gate = await requireSessionRoles(["customer"]);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return jsonError("productId required", [], 400);

    await prisma.wishlist.deleteMany({
      where: { customerId: gate.session.user.id, productId },
    });

    return jsonSuccess({ removed: true });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
