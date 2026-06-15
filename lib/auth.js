import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailVerificationRequired } from "@/lib/email-verification";
import { getAuthSecret } from "@/lib/auth-secret";
import { isProductionAccount, verifyProductionAccount, ensureProductionUsers } from "@/lib/production-users";

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

async function loadProductionUser(email, role, findFn) {
  let record = await findFn(email);
  if (!record && isProductionAccount(email)) {
    await ensureProductionUsers();
    record = await findFn(email);
  }
  if (record && isProductionAccount(email)) {
    await verifyProductionAccount(email, role);
    record = await findFn(email);
  }
  return record;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: getAuthSecret(),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "admin-login",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password;
        if (!email || !password) return null;
        const admin = await loadProductionUser(email, "admin", (e) =>
          prisma.admin.findUnique({
            where: { email: e },
            select: { id: true, name: true, email: true, password: true, isActive: true },
          })
        );
        if (!admin?.isActive) return null;
        const ok = await bcrypt.compare(String(password), admin.password);
        if (!ok) return null;
        return { id: admin.id, email: admin.email, name: admin.name, role: "admin" };
      },
    }),
    Credentials({
      id: "seller-login",
      name: "Seller",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password;
        if (!email || !password) return null;
        const seller = await loadProductionUser(email, "seller", (e) =>
          prisma.seller.findUnique({
            where: { email: e },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              isActive: true,
              verificationStatus: true,
            },
          })
        );
        if (!seller?.isActive || seller.verificationStatus !== "approved") return null;
        const ok = await bcrypt.compare(String(password), seller.password);
        if (!ok) return null;
        return { id: seller.id, email: seller.email, name: seller.name, role: "seller" };
      },
    }),
    Credentials({
      id: "customer-login",
      name: "Customer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password;
        if (!email || !password) return null;
        const customer = await loadProductionUser(email, "customer", (e) =>
          prisma.customer.findUnique({
            where: { email: e },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              isActive: true,
              avatar: true,
              emailVerifiedAt: true,
            },
          })
        );
        if (!customer?.isActive || !customer.password) return null;
        const verificationRequired =
          isEmailVerificationRequired() && !isProductionAccount(email);
        if (verificationRequired && !customer.emailVerifiedAt) return null;
        const ok = await bcrypt.compare(String(password), customer.password);
        if (!ok) return null;
        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          image: customer.avatar || undefined,
          role: "customer",
        };
      },
    }),
    Credentials({
      id: "delivery-login",
      name: "Delivery",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password;
        if (!email || !password) return null;
        const company = await prisma.deliveryCompany.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            isActive: true,
            verificationStatus: true,
          },
        });
        if (!company?.isActive || company.verificationStatus !== "approved") return null;
        const ok = await bcrypt.compare(String(password), company.password);
        if (!ok) return null;
        return { id: company.id, email: company.email, name: company.name, role: "delivery" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }
      return session;
    },
  },
});
