// Verifikasi invarian database inti (PRD §9.2) — dijalankan di CI job `db`
// (dan lokal via `npm run db:verify`) SETELAH `prisma migrate deploy` + seed.
//
// Yang diverifikasi:
// 1. audit_logs append-only: UPDATE / DELETE / TRUNCATE ditolak database.
// 2. FK menolak referensi tak dikenal (referential integrity).
// 3. Seed idempoten: run ulang tidak menduplikasi data contoh.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

let failed = 0;

async function expectRejected(name: string, pattern: RegExp, run: () => Promise<unknown>) {
  try {
    await run();
    console.error(`FAIL  ${name}: pernyataan seharusnya ditolak`);
    failed += 1;
  } catch (err) {
    if (pattern.test(String(err))) {
      console.log(`PASS  ${name}`);
    } else {
      console.error(`FAIL  ${name}: ditolak oleh error tak terduga: ${err}`);
      failed += 1;
    }
  }
}

function expectEqual(name: string, actual: number, expected: number) {
  if (actual === expected) {
    console.log(`PASS  ${name}`);
  } else {
    console.error(`FAIL  ${name}: expected ${expected}, got ${actual}`);
    failed += 1;
  }
}

async function main() {
  const sample = await prisma.auditLog.findFirst({ orderBy: { createdAt: "asc" } });
  if (!sample) {
    console.error("FAIL  audit_logs kosong — jalankan `npm run db:seed` dulu");
    process.exit(1);
  }

  await expectRejected("audit_logs UPDATE ditolak (append-only)", /append-only/i, () =>
    prisma.auditLog.update({ where: { id: sample.id }, data: { action: "tampered" } }),
  );
  await expectRejected("audit_logs DELETE ditolak (append-only)", /append-only/i, () =>
    prisma.auditLog.delete({ where: { id: sample.id } }),
  );
  await expectRejected("audit_logs TRUNCATE ditolak (append-only)", /append-only/i, () =>
    prisma.$executeRaw`TRUNCATE TABLE "audit_logs"`,
  );
  await expectRejected("user_roles FK menolak userId/roleId tak dikenal", /foreign key/i, () =>
    prisma.userRole.create({
      data: {
        userId: "00000000-0000-0000-0000-000000000000",
        roleId: "00000000-0000-0000-0000-000000000000",
      },
    }),
  );

  // Seed idempoten: berapa pun kali `npm run db:seed` dijalankan, data contoh tetap satu set.
  expectEqual(
    "seed idempoten (tepat 1 baris audit 'seed.run')",
    await prisma.auditLog.count({ where: { action: "seed.run" } }),
    1,
  );
  expectEqual("seed idempoten (tepat 2 user contoh)", await prisma.user.count(), 2);

  if (failed > 0) {
    process.exit(1);
  }
  console.log("Semua invarian DB terverifikasi.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
