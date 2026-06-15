import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["approve", "reject", "mark_paid"]),
  adminNote: z.string().max(500).optional(),
});

export async function PATCH(request, { params }) {
  const auth = await requireSessionRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const ad = await prisma.storeAdvertisement.findUnique({ where: { id: params.id } });
  if (!ad) return jsonError("Advertisement not found", [], 404);

  let data = {};

  if (parsed.data.action === "reject") {
    data = { status: "rejected", adminNote: parsed.data.adminNote || null };
  } else if (parsed.data.action === "mark_paid") {
    data = { paidAt: new Date(), adminNote: parsed.data.adminNote || ad.adminNote };
  } else if (parsed.data.action === "approve") {
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + ad.durationDays);
    data = {
      status: "active",
      startsAt,
      endsAt,
      adminNote: parsed.data.adminNote || null,
    };
    if (ad.placement === "homepage_banner" && ad.image) {
      await prisma.banner.create({
        data: {
          title: ad.title,
          image: ad.image,
          link: ad.link,
          position: "homepage",
          isActive: true,
          sortOrder: 0,
        },
      });
    }
  }

  const updated = await prisma.storeAdvertisement.update({
    where: { id: params.id },
    data,
  });

  if (parsed.data.action === "approve") {
    await prisma.notification.create({
      data: {
        sellerId: ad.sellerId,
        title: "Advertisement approved",
        message: `"${ad.title}" is scheduled to run.`,
        type: "success",
        link: "/seller/advertisements",
      },
    });
  }

  return jsonSuccess(updated);
}
