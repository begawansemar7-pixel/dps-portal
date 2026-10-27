# ADR-002 — Layout & Konvensi Kontrak API (Contract-First)

- Status: **Accepted** (2026-10-27)
- Issue: DPSP-24 (T3 — API Contract Baseline), bagian dari baseline DPSP-4
- PRD Ref: NFR-011 (API contracts), NFR-003 (API latency)

## Context

Sub-task DPSP-24 mensyaratkan "template OpenAPI 3.1 per modul di
`packages/contracts/` + shared TypeScript types". Scaffold T1 (DPSP-22) sudah
memakai `contracts/openapi.yaml` (kontrak agregat) + `src/shared/types/api.ts`
(shared types) — yang juga menjadi baseline README §2/§4.

## Decision

1. **Kontrak tetap teragregasi di `contracts/` root** (bukan `packages/contracts/`):
   `contracts/openapi.yaml` = sumber kebenaran tunggal; `contracts/module-template.yaml`
   = template yang disalin modul baru. Alasan: modular monolith dengan satu
   deployable dan satu BFF — kontrak teragregasi (per modul ditandai `tags`)
   lebih sederhana, satu dokumen untuk review/gateway/codegen. Struktur
   `packages/` baru relevan bila suatu saat ada deployable terpisah.
2. **Envelop list standar** `{ data, meta: { page, pageSize, total, totalPages } }`
   dengan `page`/`pageSize`/`sort=<field>:<asc|desc>` + filter whitelist per
   endpoint — dikodekan di `src/shared/lib/pagination.ts` dan komponen OpenAPI
   `Page`/`PageSize`/`Sort`, dipakai semua endpoint list sejak awal.
3. **Validasi input tanpa dependency baru** (hand-rolled `parseListQuery` /
   `parseBooleanFilter`): kebutuhan saat ini hanya query list. Bila endpoint
   JSON body kompleks bermunculan, evaluasi zod (atau codegen validasi dari
   OpenAPI) — saat itu baru ditambahkan.
4. **Contract test** (`src/shared/lib/contract.test.ts`, devDep `yaml`):
   dokumen kontrak harus valid YAML dan memuat komponen standar + endpoint
   contoh terdokumentasi penuh — regresi kontrak terdeteksi di CI.
5. **Smoke latency NFR-003** sebagai skrip terpisah (`npm run smoke:latency`),
   bukan gate CI: timing di runner shared flaky; cara ukur terdokumentasi di
   README §6 dan hasilnya dilaporkan di issue.

## Konsekuensi

- (+) Satu kontrak agregat mudah di-review dan jadi masukan gateway/codegen.
- (+) Konvensi list + validasi dipakai seragam sejak modul pertama, bukan
  ditambal per modul.
- (−) `contracts/module-template.yaml` harus dijaga tetap sinkron dengan
  komponen standar di `openapi.yaml` (dibantu contract test yang mem-parse
  keduanya).
- (−) Query validation hand-rolled — konsisten untuk query sederhana, tetapi
  perlu dievaluasi ulang saat JSON body validation bertambah.

## Alternatif yang dipertimbangkan

- **`packages/contracts/` per modul + agregasi**: fleksibel untuk multi-
  deployable, tetapi menambah build tooling tanpa kebutuhan nyata saat ini.
- **Zod untuk semua validasi**: ekosistem matang, tetapi menambah dependency
  untuk kebutuhan yang belum ada (lihat poin 3).
