// Seed data contoh — role, user demo, dan satu baris audit.
// Idempoten (upsert + guard baris audit) supaya aman dijalankan berulang:
// run ulang tidak mengubah apa pun (audit_logs sendiri append-only, jadi baris
// contoh hanya dibuat bila belum ada).
// Dijalankan oleh `npm run db:seed` (lihat prisma7.config.ts).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { key: "ADMIN" },
    update: {},
    create: { key: "ADMIN", name: "Administrator", description: "Akses penuh konfigurasi portal" },
  });

  const memberRole = await prisma.role.upsert({
    where: { key: "MEMBER" },
    update: {},
    create: { key: "MEMBER", name: "Member", description: "Akses standar anggota chapter" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@dps.local" },
    update: {},
    create: {
      email: "admin@dps.local",
      name: "DPS Admin",
      roles: { create: { roleId: adminRole.id } },
    },
  });

  await prisma.user.upsert({
    where: { email: "member@dps.local" },
    update: {},
    create: {
      email: "member@dps.local",
      name: "DPS Member",
      roles: { create: { roleId: memberRole.id } },
    },
  });

  // Baris contoh — hanya dibuat bila belum ada (idempoten; audit_logs append-only).
  const seededAudit = await prisma.auditLog.findFirst({ where: { action: "seed.run" } });
  if (!seededAudit) {
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "seed.run",
        entityType: "system",
        changes: { seeded: ["roles", "users"] },
      },
    });
  }

  console.log("Seed selesai: 2 role, 2 user, 1 audit log (idempoten).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
