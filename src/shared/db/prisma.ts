/** Prisma クライアントを提供するセクション。 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

type PrismaGlobal = {
  prisma?: PrismaClient;
  pool?: Pool;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

const pool =
  globalForPrisma.pool ?? new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
  globalForPrisma.prisma = prisma;
}

const disconnectPrisma = async () => {
  await prisma.$disconnect();
  await pool.end();
};

export { disconnectPrisma, prisma };
