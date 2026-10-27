// Shared API types — sumber kebenaran kontrak ada di `contracts/openapi.yaml`.
// File ini harus disinkronkan manual saat kontrak berubah (contract-first).
// TODO(sprint berikutnya): generate otomatis dari OpenAPI (openapi-typescript).

export interface HealthResponse {
  status: "ok" | "degraded";
  db: "up" | "down";
  version: string;
  timestamp: string;
}

export interface RoleDto {
  key: string;
  name: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  roles: RoleDto[];
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionDto {
  user: UserDto;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  request_id: string;
}

export interface ListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Envelope standar SEMUA endpoint list: `{ data, meta }` (konvensi README §4). */
export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

/** Query list hasil parsing + validasi (lihat `@/shared/lib/pagination`). */
export interface ListQuery<TSort extends string = string> {
  page: number;
  pageSize: number;
  sort: { field: TSort; direction: "asc" | "desc" };
  filters: Record<string, string>;
}

/** Satu item error validasi input di `ApiErrorBody.error.details`. */
export interface ValidationErrorItem {
  field: string;
  message: string;
}
