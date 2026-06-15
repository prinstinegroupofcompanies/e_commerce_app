/**
 * Upserts production login accounts (run on Render shell after deploy).
 * Usage: node scripts/ensure-production-users.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ACCOUNTS = {
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

async function main() {
  const adminHash = await bcrypt.hash(ACCOUNTS.admin.password, 12);
  await prisma.admin.upsert({
    where: { email: ACCOUNTS.admin.email },
    update: { password: adminHash, isActive: true, name: ACCOUNTS.admin.name },
    create: {
      email: ACCOUNTS.admin.email,
      password: adminHash,
      isActive: true,
      name: ACCOUNTS.admin.name,
    },
  });

  const sellerHash = await bcrypt.hash(ACCOUNTS.seller.password, 12);
  await prisma.seller.upsert({
    where: { email: ACCOUNTS.seller.email },
    update: {
      password: sellerHash,
      isActive: true,
      isShopActive: true,
      verificationStatus: "approved",
      verifiedAt: new Date(),
      rejectionReason: null,
      name: ACCOUNTS.seller.name,
      shopName: ACCOUNTS.seller.shopName,
      shopSlug: ACCOUNTS.seller.shopSlug,
      shopCountry: "Liberia",
      shopCity: "Monrovia",
      shopCounty: "Montserrado",
    },
    create: {
      email: ACCOUNTS.seller.email,
      password: sellerHash,
      isActive: true,
      isShopActive: true,
      verificationStatus: "approved",
      verifiedAt: new Date(),
      name: ACCOUNTS.seller.name,
      shopName: ACCOUNTS.seller.shopName,
      shopSlug: ACCOUNTS.seller.shopSlug,
      shopCountry: "Liberia",
      shopCity: "Monrovia",
      shopCounty: "Montserrado",
      businessCategory: "General retail",
      phone: "+2317702000001",
    },
  });

  const customerHash = await bcrypt.hash(ACCOUNTS.customer.password, 12);
  await prisma.customer.upsert({
    where: { email: ACCOUNTS.customer.email },
    update: {
      password: customerHash,
      isActive: true,
      emailVerifiedAt: new Date(),
      name: ACCOUNTS.customer.name,
    },
    create: {
      email: ACCOUNTS.customer.email,
      password: customerHash,
      isActive: true,
      emailVerifiedAt: new Date(),
      name: ACCOUNTS.customer.name,
      phone: "+2317701234567",
    },
  });

  console.log("Production accounts ready:");
  console.log(`  Admin:    ${ACCOUNTS.admin.email}`);
  console.log(`  Seller:   ${ACCOUNTS.seller.email}`);
  console.log(`  Customer: ${ACCOUNTS.customer.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
