# Design Tokens — DPS Portal

Sub-task DPSP-28 (T1 dari DPSP-5 — Design System, Token & Komponen Inti).
Referensi PRD: NFR-005 (WCAG 2.2 AA), NFR-006 (responsive).

Sumber kebenaran tunggal: [`src/app/globals.css`](../src/app/globals.css).
Dokumen ini menjelaskan arsitektur, daftar token, dan pola pakai — **jangan
menduplikasi nilai di tempat lain**; ubah di `globals.css`, dokumentasi ikut
diperbarui.

## Arsitektur

Tiga lapis di `globals.css`:

1. **`@theme` (statis)** — tipografi, grid spacing, radius → menghasilkan
   utility Tailwind (`text-base`, `p-4`, `rounded-lg`, …).
2. **`@theme inline`** — pemetaan token semantik → utility (`bg-primary`,
   `text-muted-foreground`, `shadow-md`, …). `inline` membuat nilai mengikuti
   kaskade `:root`/`.dark`.
3. **`:root` / `.dark`** — nilai semantik light dan dark.

Mode gelap diaktifkan dengan class `dark` pada `<html>`
(`@custom-variant dark` sudah terpasang). Kedua mode **wajib** mendefinisikan
set token yang identik — dijaga test.

Semua warna ditulis dalam **oklch** (perceptual): lightness antar mode konsisten,
hue lebih stabil saat di-tweak.

## Tipografi

Font: **Geist Sans** (UI) dan **Geist Mono** (kode/angka), disuntik `next/font`
di `layout.tsx` sebagai `--font-sans` / `--font-mono`. Utility:
`font-sans`, `font-mono`, `font-heading`.

| Token | Size / Line-height | Utility | Pakai |
|---|---|---|---|
| `--text-xs` | 12 / 16 | `text-xs` | label, caption, badge |
| `--text-sm` | 14 / 20 | `text-sm` | body sekunder, UI dens |
| `--text-base` | 16 / 24 | `text-base` | body utama |
| `--text-lg` | 18 / 28 | `text-lg` | body menonjol, intro |
| `--text-xl` | 20 / 28 | `text-xl` | subjudul |
| `--text-2xl` | 24 / 32 | `text-2xl` | judul section |
| `--text-3xl` | 30 / 36 | `text-3xl` | judul halaman |
| `--text-4xl` | 36 / 40 | `text-4xl` | judul hero |
| `--text-5xl` | 48 / 48 | `text-5xl` | display |

Konvensi heading: `font-heading font-semibold tracking-tight`. Body text
default `text-base text-foreground`; teks pendukung `text-sm text-muted-foreground`.

## Palet Warna (light / dark)

Semua nilai oklch `oklch(L C H)`. Kolom "kontras" = rasio pasangan fg/bg
terverifikasi (detail di § Verifikasi).

### Permukaan & teks

| Token | Light | Dark | Pakai |
|---|---|---|---|
| `--background` | `0.993 0.003 262` | `0.16 0.015 262` | latar aplikasi |
| `--foreground` | `0.21 0.02 262` | `0.965 0.008 262` | teks utama (17.4:1 / 17.5:1) |
| `--card` | `1 0 0` | `0.205 0.02 262` | permukaan kartu/panel |
| `--card-foreground` | `0.21 0.02 262` | `0.965 0.008 262` | teks di kartu |
| `--popover` | `1 0 0` | `0.225 0.02 262` | dropdown/popover |
| `--popover-foreground` | `0.21 0.02 262` | `0.965 0.008 262` | teks popover |
| `--border` | `0.915 0.012 262` | `1 0 0 / 12%` | pemisah dekoratif |
| `--input` | `0.635 0.02 262` | `0.56 0.02 262` | batas field form (≥3:1) |
| `--ring` | `0.49 0.16 262` | `0.72 0.13 262` | focus ring (≥3:1) |

### Merek & aksi

| Token | Light | Dark | Pakai |
|---|---|---|---|
| `--primary` | `0.49 0.16 262` | `0.72 0.13 262` | CTA, link, state aktif |
| `--primary-foreground` | `0.985 0.005 262` | `0.17 0.04 262` | teks di primary (6.2:1 / 7.7:1) |
| `--secondary` | `0.94 0.018 262` | `0.29 0.025 262` | tombol sekunder |
| `--secondary-foreground` | `0.32 0.05 262` | `0.96 0.008 262` | teks di secondary |
| `--muted` | `0.955 0.008 262` | `0.27 0.02 262` | latar redam |
| `--muted-foreground` | `0.51 0.02 262` | `0.71 0.02 262` | teks sekunder (5.6:1 / 7.5:1) |
| `--accent` | `0.925 0.03 262` | `0.31 0.035 262` | hover/selected |
| `--accent-foreground` | `0.32 0.06 262` | `0.96 0.008 262` | teks di accent |

### Status (success / warning / destructive / info)

| Token | Light | Dark |
|---|---|---|
| `--destructive` | `0.515 0.19 27.3` | `0.67 0.19 25` |
| `--destructive-foreground` | `0.985 0.01 27.3` | `0.16 0.03 25` |
| `--success` | `0.5 0.13 150` | `0.75 0.14 150` |
| `--success-foreground` | `0.985 0.01 150` | `0.17 0.04 150` |
| `--warning` | `0.795 0.135 78` | `0.82 0.135 85` |
| `--warning-foreground` | `0.26 0.055 78` | `0.24 0.05 85` |
| `--warning-text` | `0.46 0.095 70` | `0.82 0.135 85` |
| `--info` | `0.52 0.12 240` | `0.72 0.12 240` |
| `--info-foreground` | `0.985 0.01 240` | `0.17 0.04 240` |

Pola pakai:

- **Solid** — `bg-success text-success-foreground`, `bg-warning text-warning-foreground`, dst.
- **Badge lembut** — `bg-success/10 text-success`, `bg-destructive/10 text-destructive`,
  `bg-info/10 text-info` (main token dipakai sebagai teks; semua ≥4.5:1 di permukaan).
- **Teks amber** — amber terlalu terang untuk teks di permukaan terang:
  gunakan `text-warning-text` (7.1:1 light / 11.0:1 dark), bukan `text-warning`.

### Chart (visualisasi)

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `0.55 0.15 262` (indigo) | `0.72 0.13 262` |
| `--chart-2` | `0.6 0.11 190` (teal) | `0.75 0.11 190` |
| `--chart-3` | `0.62 0.13 75` (amber) | `0.8 0.14 80` |
| `--chart-4` | `0.58 0.18 330` (magenta) | `0.72 0.17 330` |
| `--chart-5` | `0.56 0.13 150` (hijau) | `0.73 0.14 150` |

Kelima hue ≥3:1 terhadap `--card` di kedua mode (WCAG 1.4.11 untuk elemen
grafik yang membawa informasi).

### Sidebar

`--sidebar`, `--sidebar-foreground`, `--sidebar-primary(-foreground)`,
`--sidebar-accent(-foreground)`, `--sidebar-border`, `--sidebar-ring` —
set lengkap untuk panel navigasi; nilai mengikuti pola permukaan di atas.

## Spacing — grid 4/8px

Satu unit: `--spacing: 0.25rem` (4px). Semua utility spacing Tailwind
(`p-*`, `m-*`, `gap-*`, `w-*`, …) kelipatan 4px; **layout memakai kelipatan
8px** (gap-2, gap-4, gap-6), 4px hanya untuk micro-spacing dalam komponen.

| Token | Nilai | Pakai |
|---|---|---|
| `--spacing` | `0.25rem` (4px) | dasar seluruh skala utility |
| `--spacing-touch` | `2.75rem` (44px) | target sentuh minimum |

**Target sentuh**: elemen interaktif (tombol ikon, menu item, checkbox) minimal
44×44px — `size-touch` atau `min-h-touch min-w-touch`. Ukuran komponen padat
(32px) boleh dipakai di desktop dengan pointer, tapi harus tetap punya area
sentuh ≥44px di layar sentuh.

## Radius

Satu token dasar `--radius: 0.625rem` (10px), skala diturunkan:

| Token | Nilai | Pakai |
|---|---|---|
| `--radius-sm` | ×0.6 (6px) | input kecil, chip |
| `--radius-md` | ×0.8 (8px) | tombol, dropdown item |
| `--radius-lg` | ×1 (10px) | kartu kecil |
| `--radius-xl` | ×1.4 (14px) | kartu, panel |
| `--radius-2xl` | ×1.8 (18px) | dialog |
| `--radius-3xl` | ×2.2 (22px) | hero |
| `--radius-4xl` | ×2.6 (26px) | sheet |

## Elevation

Token `--elevation-*` di `:root`/`.dark` (mode-aware: dark lebih pekat),
dimapak ke utility `shadow-xs` … `shadow-xl`:

| Utility | Light | Dark | Pakai |
|---|---|---|---|
| `shadow-xs` | 2%/6% 1px | 40% 1px | chip, input fokus |
| `shadow-sm` | 6%/8% 1–3px | 45–50% | kartu datar |
| `shadow-md` | 6%/8% 2–10px | 45–55% | dropdown, popover |
| `shadow-lg` | 7%/10% 4–28px | 50–60% | dialog |
| `shadow-xl` | 8%/12% 8–48px | 55–65% | modal, command palette |

Prinsip: elevation jangan jadi satu-satunya pembeda di dark mode — kombinasikan
dengan `--border`/`ring-foreground/10`.

## Verifikasi WCAG 2.2 AA

**Otomatis** — `npm test` menjalankan `src/design/tokens.test.ts` yang
menghitung rasio kontras langsung dari nilai token di `globals.css`
(konversi oklch → sRGB → luminansi WCAG, tanpa dependensi):

- **Teks ≥ 4.5:1** (1.4.3): semua pasangan fg/bg di atas — light & dark.
  Rasio terkecil: info light 5.20:1; body utama ±17:1.
- **Non-teks ≥ 3:1** (1.4.11): `--input` dan `--ring` terhadap background,
  kelima `--chart-*` terhadap card. Terkecil: input light 3.36:1.
- **Paritas token**: light dan dark wajib punya set token identik.

**Manual / konsumsi oleh komponen** (dipandu token, diverifikasi saat komponen
dibangun di T2+):

- **Focus ring** — pakai `focus-visible:ring-ring` (token ≥3:1 vs background
  di kedua mode); base layer sudah menyetel `outline-ring/50` global.
- **Target sentuh 44×44px** — gunakan `--spacing-touch` (2.75rem).
- Kontras teks di atas gambar/gradasi bukan cakupan token — uji per-komponen.

Perubahan nilai token tanpa menjalankan `npm test` berisiko merusak jaminan AA.
