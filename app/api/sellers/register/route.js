import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  phone: z.string().max(50).optional().nullable(),
  shopName: z.string().min(2).max(200),
  shopCountry: z.string().max(100).optional().nullable(),
  shopCity: z.string().max(100).optional().nullable(),
  shopCounty: z.string().max(100).optional().nullable(),
  businessCategory: z.string().max(120).optional().nullable(),
  businessLicense: z.string().max(500).optional().nullable(),
  shopLogo: z.string().max(2000).optional().nullable(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.seller.findUnique({ where: { email } });
    if (existing) return jsonError("An account with that email already exists", [], 409);

    let slug = slugify(parsed.data.shopName);
    if (!slug) slug = `shop-${Date.now()}`;
    const slugExisting = await prisma.seller.findUnique({ where: { shopSlug: slug } });
    if (slugExisting) slug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`;

    const hash = await bcrypt.hash(parsed.data.password, 10);

    const seller = await prisma.seller.create({
      data: {
        name: parsed.data.name,
        email,
        password: hash,
        phone: parsed.data.phone?.trim() || null,
        shopName: parsed.data.shopName,
        shopSlug: slug,
        shopCountry: parsed.data.shopCountry?.trim() || "Liberia",
        shopCity: parsed.data.shopCity?.trim() || null,
        shopCounty: parsed.data.shopCounty?.trim() || null,
        shopLogo: parsed.data.shopLogo?.trim() || null,
        businessCategory: parsed.data.businessCategory?.trim() || null,
        businessLicense: parsed.data.businessLicense?.trim() || null,
        isActive: true,
        isShopActive: false,
        verificationStatus: "pending",
      },
      select: { id: true, email: true, shopName: true, shopSlug: true, verificationStatus: true },
    });
    return jsonSuccess(
      {
        ...seller,
        message: "Registration received. Markay Hall will verify your store before activation.",
      },
      {},
      201,
    );
  } catch (e) {
    console.error("[seller-register]", e);
    return jsonError("Server error", [], 500);
  }
}
