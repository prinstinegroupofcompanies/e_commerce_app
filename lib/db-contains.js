/** @param {string} q */
export function dbContains(q) {
  const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");
  if (isPostgres) return { contains: q, mode: "insensitive" };
  return { contains: q };
}
