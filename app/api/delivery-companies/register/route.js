import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.deliveryCompany.findUnique({ where: { email } });
    if (existing) return jsonError("An account with that email already exists", [], 409);

    let slug = slugify(parsed.data.name);
    if (!slug) slug = `delivery-${Date.now()}`;
    const slugTaken = await prisma.deliveryCompany.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`;

    const hash = await bcrypt.hash(parsed.data.password, 10);
    const company = await prisma.deliveryCompany.create({
      data: {
        name: parsed.data.name,
        email,
        password: hash,
        phone: parsed.data.phone?.trim() || null,
        address: parsed.data.address?.trim() || null,
        city: parsed.data.city?.trim() || null,
        county: parsed.data.county?.trim() || null,
        slug,
        verificationStatus: "pending",
      },
      select: { id: true, name: true, email: true, slug: true, verificationStatus: true },
    });

    return jsonSuccess(
      {
        ...company,
        message: "Registration received. Markay Hall will verify your company before activation.",
      },
      {},
      201,
    );
  } catch (e) {
    console.error("[delivery-register]", e);
    return jsonError("Server error", [], 500);
  }
}
