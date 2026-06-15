import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const PRODUCTION_ACCOUNTS = {
  admin: {
    email: "admin@markayhall.com",
    password: "Admin@MarkayHall",
    name: "Markay Hall Admin",
  },
  seller: {
    email: "seller@markayhall.com",
    password: "Seller@2026",
    name: "Markay Hall Seller",
    shopName: "Markay Hall Official Store",
    shopSlug: "markay-hall-official",
  },
  customer: {
    email: "customer@markayhall.com",
    password: "Customer@2026",
    name: "Markay Hall Customer",
  },
};

/** Emails that must always be verified/approved for production login. */
export const PRODUCTION_EMAILS = new Set(
  Object.values(PRODUCTION_ACCOUNTS).map((a) => a.email.toLowerCase())
);

export function isProductionAccount(email) {
  return PRODUCTION_EMAILS.has(String(email || "").toLowerCase().trim());
}

/**
 * Creates or updates verified production accounts in the database.
 */
export async function ensureProductionUsers() {
  const adminHash = await bcrypt.hash(PRODUCTION_ACCOUNTS.admin.password, 12);
  await prisma.admin.upsert({
    where: { email: PRODUCTION_ACCOUNTS.admin.email },
    update: {
      password: adminHash,
      isActive: true,
      name: PRODUCTION_ACCOUNTS.admin.name,
    },
    create: {
      email: PRODUCTION_ACCOUNTS.admin.email,
      password: adminHash,
      isActive: true,
      name: PRODUCTION_ACCOUNTS.admin.name,
    },
  });

  const sellerHash = await bcrypt.hash(PRODUCTION_ACCOUNTS.seller.password, 12);
  await prisma.seller.upsert({
    where: { email: PRODUCTION_ACCOUNTS.seller.email },
    update: {
      password: sellerHash,
      isActive: true,
      isShopActive: true,
      verificationStatus: "approved",
      verifiedAt: new Date(),
      rejectionReason: null,
      name: PRODUCTION_ACCOUNTS.seller.name,
      shopName: PRODUCTION_ACCOUNTS.seller.shopName,
      shopSlug: PRODUCTION_ACCOUNTS.seller.shopSlug,
      shopCountry: "Liberia",
      shopCity: "Monrovia",
      shopCounty: "Montserrado",
    },
    create: {
      email: PRODUCTION_ACCOUNTS.seller.email,
      password: sellerHash,
      isActive: true,
      isShopActive: true,
      verificationStatus: "approved",
      verifiedAt: new Date(),
      name: PRODUCTION_ACCOUNTS.seller.name,
      shopName: PRODUCTION_ACCOUNTS.seller.shopName,
      shopSlug: PRODUCTION_ACCOUNTS.seller.shopSlug,
      shopCountry: "Liberia",
      shopCity: "Monrovia",
      shopCounty: "Montserrado",
      businessCategory: "General retail",
      phone: "+2317702000001",
    },
  });

  const customerHash = await bcrypt.hash(PRODUCTION_ACCOUNTS.customer.password, 12);
  await prisma.customer.upsert({
    where: { email: PRODUCTION_ACCOUNTS.customer.email },
    update: {
      password: customerHash,
      isActive: true,
      emailVerifiedAt: new Date(),
      name: PRODUCTION_ACCOUNTS.customer.name,
    },
    create: {
      email: PRODUCTION_ACCOUNTS.customer.email,
      password: customerHash,
      isActive: true,
      emailVerifiedAt: new Date(),
      name: PRODUCTION_ACCOUNTS.customer.name,
      phone: "+2317701234567",
    },
  });

  return {
    ok: true,
    accounts: {
      admin: PRODUCTION_ACCOUNTS.admin.email,
      seller: PRODUCTION_ACCOUNTS.seller.email,
      customer: PRODUCTION_ACCOUNTS.customer.email,
    },
  };
}

/**
 * Ensures a user record is verified before/during login (production accounts only).
 */
export async function verifyProductionAccount(email, role) {
  const normalized = String(email || "").toLowerCase().trim();
  if (!isProductionAccount(normalized)) return;

  if (role === "seller") {
    await prisma.seller.updateMany({
      where: { email: normalized },
      data: {
        verificationStatus: "approved",
        verifiedAt: new Date(),
        isActive: true,
        isShopActive: true,
        rejectionReason: null,
      },
    });
  }

  if (role === "customer") {
    await prisma.customer.updateMany({
      where: { email: normalized },
      data: { emailVerifiedAt: new Date(), isActive: true },
    });
  }

  if (role === "admin") {
    await prisma.admin.updateMany({
      where: { email: normalized },
      data: { isActive: true },
    });
  }
}
