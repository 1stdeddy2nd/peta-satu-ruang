import { PrismaClient } from "@prisma/client";

/**
 * One client for the process. Next.js hot-reloads modules in development, and
 * a fresh PrismaClient per reload exhausts the connection pool within minutes.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
