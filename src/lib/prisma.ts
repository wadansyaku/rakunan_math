import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const datasourceUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasourceUrl,
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
