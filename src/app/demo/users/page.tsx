// Demo kontrak lintas stack (DPSP-24) — bukti shared types dipakai
// frontend + backend tanpa duplikasi definisi. Rute terpisah dari halaman
// placeholder utama agar tidak berebut area dengan kerja UI (DPSP-28/T4).
import { UsersDemo } from "@/modules/identity/ui/users-demo";

export default function DemoUsersPage() {
  return (
    <main>
      <h1>Demo kontrak: GET /api/v1/users</h1>
      <p>
        Contoh konsumsi API memakai shared types (src/shared/types/api.ts) — referensi untuk modul
        lain.
      </p>
      <UsersDemo />
    </main>
  );
}
