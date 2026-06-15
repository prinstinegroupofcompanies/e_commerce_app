import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
export const dynamic = "force-dynamic";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const shopPatchSchema = z.object({
  shopName: z.string().min(1).max(200).optional(),
  shopSlug: z
    .string()
    .min(1)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  shopDescription: z.string().max(5000).optional().nullable(),
  shopLogo: z.string().max(2000).optional().nullable(),
  shopBanner: z.string().max(2000).optional().nullable(),
  shopAddress: z.string().max(500).optional().nullable(),
  shopCity: z.string().max(100).optional().nullable(),
  shopCountry: z.string().max(100).optional().nullable(),
  isShopActive: z.boolean().optional(),
});

export async function GET() {
  const gate = await requireSessionRoles(["seller"]);
  if (!gate.ok) return gate.response;

  const seller = await prisma.seller.findUnique({
    where: { id: gate.session.user.id },
    select: {
      id: true,
      shopName: true,
      shopSlug: true,
      shopDescription: true,
      shopLogo: true,
      shopBanner: true,
      shopAddress: true,
      shopCity: true,
      shopCountry: true,
      isShopActive: true,
    },
  });

  if (!seller) return jsonError("Seller not found", [], 404);
  return jsonSuccess(seller);
}

export async function PATCH(request) {
  try {
    const gate = await requireSessionRoles(["seller"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = shopPatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const data = parsed.data;
    if (data.shopSlug) {
      const dup = await prisma.seller.findFirst({
        where: { shopSlug: data.shopSlug, NOT: { id: gate.session.user.id } },
        select: { id: true },
      });
      if (dup) return jsonError("Shop slug already in use", [], 409);
    }

    const updated = await prisma.seller.update({
      where: { id: gate.session.user.id },
      data: {
        ...(data.shopName != null ? { shopName: data.shopName } : {}),
        ...(data.shopSlug != null ? { shopSlug: data.shopSlug } : {}),
        ...(data.shopDescription !== undefined ? { shopDescription: data.shopDescription } : {}),
        ...(data.shopLogo !== undefined ? { shopLogo: data.shopLogo } : {}),
        ...(data.shopBanner !== undefined ? { shopBanner: data.shopBanner } : {}),
        ...(data.shopAddress !== undefined ? { shopAddress: data.shopAddress } : {}),
        ...(data.shopCity !== undefined ? { shopCity: data.shopCity } : {}),
        ...(data.shopCountry !== undefined ? { shopCountry: data.shopCountry } : {}),
        ...(data.isShopActive != null ? { isShopActive: data.isShopActive } : {}),
      },
    });

    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
