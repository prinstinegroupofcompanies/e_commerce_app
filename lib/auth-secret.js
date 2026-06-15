/** Shared secret for NextAuth JWT (middleware + auth config must match). */
export function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || undefined;
}

export function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}
