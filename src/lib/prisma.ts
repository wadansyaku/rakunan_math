import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

const pooledUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
const directUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL;
const connectionString = pooledUrl || directUrl;

if (!connectionString || !connectionString.startsWith("postgres")) {
    throw new Error("DATABASE_URL is missing or invalid. Set DATABASE_URL or POSTGRES_PRISMA_URL to a valid postgres URL.");
}

const pool = globalForPrisma.pool ?? new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
    globalForPrisma.pool = pool;
}
