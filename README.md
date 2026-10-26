# Portal Chapter DPS — Engineering README

Baseline fondasi teknis untuk Portal Chapter Digital Product & Solution (DPS):
**Modular Monolith · API-First · AI-Ready** (PRD DPS-PRD-001 §12).
Repo: `git@github.com:begawansemar7-pixel/dps-portal.git`

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL · Prisma · Vitest · GitHub Actions.

---

## 1. Menjalankan lokal (bootstrap)

Prasyarat: **Node.js 24+**, **Docker** (untuk PostgreSQL lokal), npm.

```bash
git clone git@github.com:begawansemar7-pixel/dps-portal.git
cd dps-portal

cp .env.example .env          # sesuaikan bila perlu (jangan commit .env)
docker compose up -d db       # PostgreSQL lokal di :5432

npm install                   # sekaligus menjalankan `prisma generate`
npm run db:migrate            # apply seluruh migration dari awal
npm run db:seed               # seed data contoh (role, user demo, audit log)

npm run dev                   # http://localhost:3000
```

Verifikasi:

- `http://localhost:3000` → halaman placeholder Portal Chapter DPS.
- `http://localhost:3000/api/v1/health` → `{"status":"ok","db":"up",...}`.

Perintah penting lainnya:

| Perintah               | Fungsi                                             |
| ---------------------- | -------------------------------------------------- |
| `npm run lint`         | ESLint                                             |
| `npm run typecheck`    | `tsc --noEmit`                                     |
| `npm test`             | Unit test (Vitest)                                 |
| `npm run build`        | Production build                                   |
| `npm run db:generate`  | Regenerate Prisma client                           |
| `npx prisma migrate dev --name <nama>` | Buat migration baru setelah ubah schema |
| `npm run db:seed`      | Seed database (idempoten)                          |
| `npm run db:reset`     | Reset database lokal: drop, migrate ulang, seed ulang (**destruktif**) |
| `npm run db:verify`    | Verifikasi invarian DB (append-only, FK, seed idempoten) |

## 2. Struktur folder (Modular Monolith)

```
contracts/            # Kontrak API (OpenAPI) — sumber kebenaran kontrak
docs/adr/             # Architecture Decision Records (mis. ADR-001 ORM/migration)
prisma/               # Schema DB terpusat per domain + migrations + seed
scripts/              # Tooling operasional (branch protection, dll.)
src/
  app/                # Next.js App Router: UI + mount point route /api/v1/*
  modules/            # Per domain bisnis (lihat tabel) — TIDAK saling import internal
    <domain>/
      api/            #   route handler per endpoint
      services/       #   aturan bisnis domain
      repositories/   #   akses DB via Prisma
  shared/             # Kernel lintas modul: types (DTO), lib (logger, errors, api)
  infrastructure/     # Teknologi yang dipakai bersama (db.ts = singleton Prisma)
  components/         # Komponen UI (shadcn/ui di components/ui)
  generated/prisma/   # HASIL GENERATE — tidak di-commit
```

| Domain modul    | Tanggung jawab                                                        |
| --------------- | --------------------------------------------------------------------- |
| `identity`      | Auth, user, role, RBAC (referensi pola modul)                         |
| `organization`  | Struktur organisasi chapter & data owner                              |
| `talent`        | Master talent, kompetensi, availability                               |
| `assignment`    | Assignment & fulfillment (request → match → penugasan)                |
| `delivery`      | Delivery & project management                                         |
| `workload`      | Workload & timesheet                                                  |
| `reporting`     | KPI dashboard & reporting                                             |
| `knowledge`     | Knowledge management                                                  |
| `financial`     | Budget & financial                                                    |
| `ai`            | AI workspace (TANIA/JARVIS), guardrails, model gateway                |

Aturan antar modul: **dilarang** mengimpor `api/`/`services/`/`repositories/`
modul lain. Integrasi antar domain lewat tabel database + `audit_logs`, atau
tipe DTO di `src/shared/types/api.ts`.

Aturan ini **ditegakkan otomatis** oleh ESLint (`no-restricted-imports` per
domain di `eslint.config.mjs`), jadi `npm run lint` gagal bila ada import
lintas-domain. Import di dalam domain sendiri boleh memakai path relatif atau
alias `@/modules/<domain>/...`.

## 3. Database & migration

Keputusan ORM & migration tool dicatat di `docs/adr/ADR-001-orm-dan-migration.md`.

- ORM: **Prisma 7** (`prisma/schema.prisma`, config di `prisma7.config.ts`).
- Skema inti: `users`, `roles`, `user_roles` (RBAC), `audit_logs`.
- Migration dikomit di `prisma/migrations/` dan **wajib backward-compatible**
  (tambah kolom nullable/default dulu, drop di PR terpisah setelah tidak dipakai).
- Menambah field domain: edit group `// --- <domain> ---` di `schema.prisma`,
  jalankan `npx prisma migrate dev --name <nama>`, commit hasil migration-nya.

### Konvensi penamaan (berlaku untuk semua modul)

| Objek          | Aturan                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| Tabel          | snake_case, plural, via `@@map` (`users`, `user_roles`, `audit_logs`)    |
| Kolom          | camelCase (`passwordHash`, `createdAt`)                                 |
| Primary key    | `id` UUID (`@default(uuid()) @db.Uuid`); tabel join boleh composite key (`user_roles`) |
| Foreign key    | `<entity>Id` UUID dengan `onDelete` **eksplisit** (Cascade / SetNull / Restrict) |
| Timestamp      | `createdAt`, `updatedAt` (`@updatedAt`)                                  |

### Integritas & audit (PRD §9.2)

- **UUID PK + FK** dengan referential integrity — `onDelete` eksplisit per FK.
- **`audit_logs` append-only**: tidak hanya konvensi aplikasi (hanya `create`),
  tetapi **ditegakkan trigger PostgreSQL** (migration
  `20261026153000_audit_log_append_only`) — UPDATE/DELETE/TRUNCATE ditolak.
  Diverifikasi otomatis oleh `npm run db:verify` (dijalankan di CI job `db`).
- **Soft-delete** (`deletedAt`) hanya untuk entity yang memang butuh
  retention/riwayat menurut aturan bisnis — default adalah hard-delete dengan
  `onDelete` eksplisit. `users` memakai `isActive` (nonaktif, bukan hapus) agar
  jejak audit tetap bermakna; `audit_logs` tidak pernah dihapus.

### Seed data contoh (`prisma/seed.ts`)

Idempoten (upsert + guard) — aman dijalankan berulang, tidak menduplikasi data.
Isi seed:

| Data                       | Nilai                                                  |
| -------------------------- | ------------------------------------------------------ |
| Role                       | `ADMIN` (Administrator), `MEMBER` (Member)              |
| User demo                  | `admin@dps.local` (ADMIN), `member@dps.local` (MEMBER)  |
| Audit log contoh           | 1 baris `seed.run` (entity `system`)                    |

Reset ke kondisi awal (drop + migrate + seed ulang, **destruktif**, lokal saja):
`npm run db:reset`.

## 4. API contract (contract-first)

- Kontrak: `contracts/openapi.yaml` (OpenAPI 3.1). **Ubah kontrak dulu**, lalu
  implementasi.
- Shared types: `src/shared/types/api.ts` (disinkronkan manual dengan kontrak;
  rencana: codegen `openapi-typescript`).
- Prefix: `/api/v1`. Versi bertambah hanya untuk perubahan breaking.
- Success: DTO langsung, atau `{ "data": [...] }` untuk list.
- Error selalu: `{"error":{"code","message","details?"},"request_id":"..."}` —
  jangan pernah membocorkan detail internal (lihat `src/shared/lib/errors.ts`).
- Endpoint contoh terdokumentasi: `GET /api/v1/health`, `GET /api/v1/users`.
  Endpoint auth/RBAC dasar (`/auth/login|logout|me`) sudah dikontrakkan,
  implementasi menyusul mengikuti keputusan DEC-03.

## 5. Observability & error handling

- Structured logging: **pino** (`src/shared/lib/logger.ts`), JSON ke stdout,
  field sensitif (authorization, cookie, password) di-redact.
- Setiap request API melewati wrapper `handleRoute` (`src/shared/lib/api.ts`):
  `request_id` (header `x-request-id`), log method/path/status/duration.
- Service/repository **melempar `AppError`** (`NOT_FOUND`, `BAD_REQUEST`, dst.);
  wrapper yang menerjemahkannya ke HTTP + envelope error.
- Rencana NFR-009 berikutnya: OpenTelemetry-compatible metrics/traces.

## 6. Testing

- Unit test: **Vitest**, file `*.test.ts` di samping kode yang diuji,
  jalankan `npm test`.
- Minimal: logika bisnis dan helper (mis. RBAC, error mapping) punya test.
- Migration diverifikasi otomatis di CI (job `db`) terhadap PostgreSQL asli,
  termasuk invarian DB (`npm run db:verify`): `audit_logs` append-only,
  FK, dan idempotensi seed.

## 7. Commit, PR & CI/CD

- **Commit**: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`, `ci:` + deskripsi ringkas.
- **PR**: buka PR ke `main`; **judul PR WAJIB memuat key issue** (format
  `DPSP-x`, mis. `DPSP-4: fondasi setup proyek`) agar otomatis ter-link ke
  issue. Gunakan template PR (`.github/PULL_REQUEST_TEMPLATE.md`).
- **CI** (`.github/workflows/ci.yml`) berjalan di setiap PR:
  - job `quality`: lint → typecheck → unit test → build
  - job `db`: `prisma migrate deploy` + seed terhadap PostgreSQL 16 asli
- **Branch protection** `main` (jalankan sekali oleh owner repo):
  `./scripts/setup-branch-protection.sh` — PR wajib, 1 approval, CI hijau
  (`quality` + `db`), tanpa force-push.

## 8. Asumsi yang menunggu keputusan (PRD §19)

| ID     | Asumsi yang dipakai baseline ini                                    | Konsekuensi bila berubah                          |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------- |
| DEC-03 | Autentikasi: credentials + session token dulu; SSO menyusul         | Ganti provider auth di `modules/identity`         |
| DEC-04 | Hosting: container Docker (portable ke VPS/private cloud/on-prem)   | Sesuaikan deployment target, app tidak berubah    |

Keputusan arsitektur lengkap (DEC-01..DEC-07) dicatat di issue DPSP-4 untuk
review PO/management.
