"use client";

// Demo kontrak shared types (DPSP-24): komponen frontend memakai DTO yang
// sama dengan backend (`@/shared/types/api`) via `apiGet` — tanpa duplikasi
// definisi. Contoh ini akan digantikan UI asli modul (T4) — hanya bukti
// bahwa lintas stack berbagi satu kontrak.
import { useEffect, useState } from "react";
import { ApiClientError, apiGet } from "@/shared/lib/api-client";
import type { ListResponse, UserDto } from "@/shared/types/api";

export function UsersDemo() {
  const [users, setUsers] = useState<ListResponse<UserDto> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<ListResponse<UserDto>>("/api/v1/users?pageSize=5&sort=name:asc")
      .then(setUsers)
      .catch((err: unknown) =>
        setError(err instanceof ApiClientError ? err.message : "Gagal memuat data"),
      );
  }, []);

  if (error) return <p role="alert">Error: {error}</p>;
  if (!users) return <p>Memuat…</p>;

  return (
    <div>
      <ul>
        {users.data.map((user) => (
          <li key={user.id}>
            {user.name} — {user.email} [{user.roles.map((r) => r.key).join(", ") || "tanpa role"}]
          </li>
        ))}
      </ul>
      <p>
        Halaman {users.meta.page} dari {users.meta.totalPages} (total {users.meta.total} user)
      </p>
    </div>
  );
}
