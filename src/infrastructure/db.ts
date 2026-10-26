// Singleton PrismaClient — satu instance untuk seluruh aplikasi.
// (Dev hot-reload membuat instance baru; cache di globalThis mencegah
// kehabisan koneksi database.)
// Prisma 7 memakai driver adapter (@prisma/adapter-pg) untuk koneksi.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
