// Konvensi pagination, sort, dan filter untuk SEMUA endpoint list (README §4).
// Aturan:
// - `page` 1-based (default 1), `pageSize` default 10, maksimal 100.
// - `sort` berformat `<field>:asc|desc` dengan whitelist field per endpoint.
// - Filter dikirim sebagai query params biasa; hanya field yang terdaftar di
//   `spec.filters` yang dipakai (param lain diabaikan), nilainya divalidasi
//   endpoint terkait (mis. boolean harus "true"/"false").
// - Input tidak valid → AppError BAD_REQUEST dengan `details` berupa daftar
//   `{ field, message }` (envelope error standar, lihat ./errors.ts).
import { AppError } from "./errors";
import type { ListQuery, ValidationErrorItem } from "@/shared/types/api";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export interface ListQuerySpec<TSort extends string> {
  /** Whitelist kolom yang boleh dipakai di `sort`. */
  readonly sortable: readonly TSort[];
  /** Whitelist nama filter (query params) yang dikenal endpoint. */
  readonly filters?: readonly string[];
}

function invalid(errors: ValidationErrorItem[]): AppError {
  return new AppError("BAD_REQUEST", "Query tidak valid", errors);
}

export function parseListQuery<TSort extends string>(
  searchParams: URLSearchParams,
  spec: ListQuerySpec<TSort>,
): ListQuery<TSort> {
  const errors: ValidationErrorItem[] = [];

  let page = 1;
  const rawPage = searchParams.get("page");
  if (rawPage !== null) {
    page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) {
      errors.push({ field: "page", message: "harus bilangan bulat >= 1" });
    }
  }

  let pageSize = DEFAULT_PAGE_SIZE;
  const rawPageSize = searchParams.get("pageSize");
  if (rawPageSize !== null) {
    pageSize = Number(rawPageSize);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      errors.push({
        field: "pageSize",
        message: `harus bilangan bulat 1..${MAX_PAGE_SIZE}`,
      });
    }
  }

  let sort: ListQuery<TSort>["sort"] | undefined;
  const rawSort = searchParams.get("sort");
  if (rawSort !== null) {
    const [field, direction] = rawSort.split(":");
    if ((direction === "asc" || direction === "desc") && spec.sortable.includes(field as TSort)) {
      sort = { field: field as TSort, direction };
    } else {
      errors.push({
        field: "sort",
        message: `format <field>:asc|desc dengan field salah satu dari: ${spec.sortable.join(", ")}`,
      });
    }
  }

  if (errors.length > 0) {
    throw invalid(errors);
  }

  const filters: Record<string, string> = {};
  for (const name of spec.filters ?? []) {
    const value = searchParams.get(name);
    if (value !== null && value !== "") {
      filters[name] = value;
    }
  }

  return {
    page,
    pageSize,
    sort: sort ?? { field: spec.sortable[0], direction: "desc" },
    filters,
  };
}

/** Validasi filter boolean (`true`/`false`) — lempar BAD_REQUEST bila salah. */
export function parseBooleanFilter(value: string | undefined, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw invalid([{ field, message: 'harus "true" atau "false"' }]);
}
