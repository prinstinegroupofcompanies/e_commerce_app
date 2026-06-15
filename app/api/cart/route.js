import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const lineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  name: z.string().min(1),
  price: z.coerce.number(),
  quantity: z.coerce.number().int().positive(),
  image: z.string().nullable().optional(),
  sellerId: z.string().nullable().optional(),
});

const postSchema = z.object({
  items: z.array(lineSchema).max(200),
  coupon: z.string().nullable().optional(),
});

function lineToClient(row) {
  return {
    productId: row.productId,
    variantId: row.variantKey ? row.variantKey : null,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
    image: row.image,
    sellerId: row.sellerId,
  };
}

/** @param {import("@prisma/client").CartItem} row */
function variantKeyFromLine(row) {
  return row.variantId == null || row.variantId === "" ? "" : String(row.variantId);
}

/** @param {{ variantId?: string | null }} line */
function variantKeyFromClient(line) {
  return line.variantId == null || line.variantId === "" ? "" : String(line.variantId);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "customer") {
      return jsonSuccess({ items: [], coupon: null });
    }

    const cart = await prisma.cart.findUnique({
      where: { customerId: session.user.id },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!cart) {
      return jsonSuccess({ items: [], coupon: null });
    }

    return jsonSuccess({
      items: cart.items.map(lineToClient),
      coupon: cart.couponCode,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "customer") {
      return jsonError("Unauthorized", [], 401);
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const { items, coupon } = parsed.data;
    const couponCode = coupon?.trim() ? coupon.trim().toUpperCase() : null;

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { customerId: session.user.id },
        create: {
          customerId: session.user.id,
          couponCode,
        },
        update: { couponCode },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (items.length > 0) {
        await tx.cartItem.createMany({
          data: items.map((line) => ({
            cartId: cart.id,
            productId: line.productId,
            variantKey: variantKeyFromClient(line),
            name: line.name,
            price: line.price,
            quantity: line.quantity,
            image: line.image ?? null,
            sellerId: line.sellerId ?? null,
          })),
        });
      }
    });

    return jsonSuccess({ saved: true });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
