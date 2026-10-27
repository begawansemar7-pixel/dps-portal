// Typed fetch helper untuk frontend — memakai shared types yang SAMA dengan
// backend (`@/shared/types/api`), sehingga definisi kontrak tidak duplikat
// antara frontend dan backend (konvensi contract-first, README §4).
import type { ApiErrorBody } from "@/shared/types/api";

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error.message ?? `HTTP ${status}`);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // respons error non-JSON (mis. proxy) — biarkan body null
    }
    throw new ApiClientError(res.status, body);
  }
  return (await res.json()) as T;
}
