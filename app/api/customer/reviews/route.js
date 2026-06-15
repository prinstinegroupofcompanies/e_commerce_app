import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { cookies } from "next/headers";
import { recordInteraction } from "@/lib/chat/interactions";
import { VISITOR_COOKIE } from "@/lib/chat/visitor";

export const dynamic = "force-dynamic";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  body: z.string().max(5000).optional().nullable(),
});

export async function GET() {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;
  const reviews = await prisma.review.findMany({
    where: { customerId: gate.session.user.id },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true, images: true } } },
  });
  return jsonSuccess(reviews);
}

export async function POST(request) {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true, sellerId: true, isActive: true },
    });
    if (!product || !product.isActive) return jsonError("Product not found", [], 404);

    const hasOrdered = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { customerId: gate.session.user.id, paymentStatus: { in: ["paid", "refunded"] } },
      },
      select: { id: true },
    });
    if (!hasOrdered) {
      return jsonError("You can only review products you have purchased", [], 403);
    }

    const existing = await prisma.review.findFirst({
      where: { productId: product.id, customerId: gate.session.user.id },
      select: { id: true },
    });

    const data = {
      productId: product.id,
      sellerId: product.sellerId,
      customerId: gate.session.user.id,
      rating: parsed.data.rating,
      title: parsed.data.title?.trim() || null,
      body: parsed.data.body?.trim() || null,
      isApproved: false,
    };

    const review = existing
      ? await prisma.review.update({ where: { id: existing.id }, data })
      : await prisma.review.create({ data });

    const cookieStore = await cookies();
    const visitorKey =
      cookieStore.get(VISITOR_COOKIE)?.value ||
      (
        await prisma.visitorProfile.findFirst({
          where: { customerId: gate.session.user.id },
          select: { visitorKey: true },
        })
      )?.visitorKey ||
      `cust_${gate.session.user.id}`;

    await recordInteraction({
      visitorKey,
      customerId: gate.session.user.id,
      eventType: "review",
      productId: product.id,
      sellerId: product.sellerId,
      metadata: { rating: parsed.data.rating, reviewId: review.id },
    });

    return jsonSuccess(review, {}, existing ? 200 : 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
