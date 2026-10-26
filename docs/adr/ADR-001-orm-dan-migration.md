# ADR-001 — ORM & Migration Tool: Prisma 7 + Prisma Migrate

- Status: **Accepted** (2026-10-26)
- Issue: DPSP-23 (T2 — DB/Schema Core), bagian dari baseline DPSP-4
- PRD Ref: §9.2 (Data Governance), NFR-011

## Context

Portal DPS butuh koneksi PostgreSQL dengan:

- migration yang versioned, bisa diulang dari fresh database, dan otomatis
  diverifikasi di CI;
- penegakan konvensi skema (UUID PK, FK dengan `ON DELETE` eksplisit,
  `audit_logs` append-only) yang konsisten antar modul;
- type-safe query dari TypeScript (stack Next.js/TS monorepo modular).

## Decision

1. **ORM: Prisma 7** dengan driver adapter `@prisma/adapter-pg`
   (koneksi via `DATABASE_URL`, singleton di `src/infrastructure/db.ts`).
2. **Migration tool: Prisma Migrate**. File SQL dikomit di
   `prisma/migrations/`, diterapkan dengan `prisma migrate deploy`
   (`npm run db:migrate`) — juga di CI job `db` terhadap PostgreSQL 16 asli.
3. **Konfigurasi** di `prisma7.config.ts` (env di-load eksplisit via dotenv).
4. **Seed** via `prisma db seed` (`npm run db:seed`, `prisma/seed.ts`),
   idempoten dan dapat di-reset dengan `npm run db:reset`.
5. Objek yang tidak direpresentasikan `schema.prisma` (mis. trigger
   append-only `audit_logs`) ditulis sebagai **migration SQL manual** dan
   diverifikasi oleh `npm run db:verify` (`scripts/verify-db-invariants.ts`).

## Konsekuensi

- (+) Query type-safe; migration replayable & otomatis di CI.
- (+) `schema.prisma` jadi sumber kebenaran; diff migration SQL mudah di-review.
- (−) Trigger/function tidak terlihat di `schema.prisma` — didokumentasikan di
  file migration, README §3, dan diverifikasi `db:verify`.
- (−) Lock-in Prisma; skema domain baru wajib mengikuti konvensi penamaan
  README §3.

## Alternatif yang dipertimbangkan

- **Knex + pg / Drizzle**: lebih ringan, tapi migration & introspeksi manual,
  konvensi (UUID PK, FK eksplisit) harus ditegakkan sendiri per modul.
- **TypeORM**: dekorator entity, tapi kualitas migration dan DX TypeScript
  Prisma lebih baik untuk greenfield.
