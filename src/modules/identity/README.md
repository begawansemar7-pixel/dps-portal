# Module: identity

Autentikasi, user, role & RBAC (NFR-004). Referensi implementasi pola modul: lihat repository, api, rbac di modul ini.

## Konvensi

- `api/` — route handler per endpoint (di-mount dari `src/app/api/v1/*`)
- `services/` — aturan bisnis domain; satu-satunya lapisan yang memanggil repository
- `repositories/` — akses database via Prisma (`src/infrastructure/db.ts`)
- Tipe DTO domain ada di `src/shared/types/api.ts` dan dikontrakkan di `contracts/openapi.yaml`

Antar modul TIDAK boleh saling import internal (repository/service) — gunakan
tipe shared atau tabel `audit_log` untuk jejak perubahan.
