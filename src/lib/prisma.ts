import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function resolveConnectionString(): string | null {
  const normalize = (value: string | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim().replace(/^["']|["']$/g, "");
    const match = trimmed.match(/postgres(?:ql)?:\/\/[^\s"']+/);
    return match ? match[0] : null;
  };

  const pooledUrl =
    normalize(process.env.POSTGRES_PRISMA_URL) ||
    normalize(process.env.POSTGRES_URL) ||
    normalize(process.env.DATABASE_URL) ||
    normalize(process.env.STORAGE_POSTGRES_PRISMA_URL) ||
    normalize(process.env.STORAGE_POSTGRES_URL) ||
    normalize(process.env.STORAGE_DATABASE_URL);
  const directUrl =
    normalize(process.env.POSTGRES_URL_NON_POOLING) ||
    normalize(process.env.DATABASE_URL_UNPOOLED) ||
    normalize(process.env.DIRECT_URL) ||
    normalize(process.env.STORAGE_POSTGRES_URL_NON_POOLING) ||
    normalize(process.env.STORAGE_DATABASE_URL_UNPOOLED);
  return pooledUrl || directUrl || null;
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = resolveConnectionString();

  if (!connectionString || !connectionString.startsWith("postgres")) {
    throw new Error(
      "DATABASE_URL is missing or invalid. Set POSTGRES_PRISMA_URL/POSTGRES_URL or STORAGE_POSTGRES_PRISMA_URL/STORAGE_POSTGRES_URL to a valid postgres URL (no quotes, no KEY= prefix)."
    );
  }

  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.pool = pool;
  }

  return prisma;
}
