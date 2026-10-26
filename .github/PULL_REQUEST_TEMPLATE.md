## Perubahan

<!-- Jelaskan perubahan dan motivasinya -->

## Issue

- Key issue: <!-- WAJIB: format DPSP-x, contoh `DPSP-4`. Key di judul PR membuat PR otomatis ter-link ke issue. -->
- PRD / requirement ID terkait: <!-- mis. §9.2, NFR-011 -->

## Checklist

- [ ] Judul PR mengandung key issue `DPSP-x`
- [ ] Commit mengikuti Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`)
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` lulus lokal
- [ ] Perubahan skema DB disertai migration yang backward-compatible + seed diperbarui bila perlu
- [ ] `contracts/openapi.yaml` & `src/shared/types/api.ts` diperbarui bila mengubah API
- [ ] Tidak ada secret/kredensial yang ter-commit
