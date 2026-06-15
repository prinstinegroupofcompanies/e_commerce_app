/**
 * Switches Prisma provider to postgresql when DATABASE_URL is a Postgres connection.
 * Keeps sqlite in the repo for local dev; CI/production builds run this before generate.
 */
const fs = require("node:fs");
const path = require("node:path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const url = process.env.DATABASE_URL || "";

if (!url.startsWith("postgres")) {
  console.log("[prepare-prisma] SQLite/local DATABASE_URL — schema unchanged");
  process.exit(0);
}

let schema = fs.readFileSync(schemaPath, "utf8");
if (schema.includes('provider = "postgresql"')) {
  console.log("[prepare-prisma] Already configured for PostgreSQL");
  process.exit(0);
}

schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
fs.writeFileSync(schemaPath, schema);
console.log("[prepare-prisma] Switched Prisma provider to postgresql");
