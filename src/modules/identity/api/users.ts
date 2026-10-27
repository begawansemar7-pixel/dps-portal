// Contoh endpoint modul (identity): GET /api/v1/users
// Route handler app/ hanya me-re-export file ini (lihat konvensi README).
// Ini CONTOH ACUAN untuk semua endpoint list: parse+validasi query
// (pagination/sort/filter) via `parseListQuery`, envelope `{ data, meta }`,
// error envelope standar otomatis dari `handleRoute`. Kontrak lengkap
// (request/response/error + contoh) ada di contracts/openapi.yaml.
import { NextResponse } from "next/server";
import { handleRoute } from "@/shared/lib/api";
import { parseBooleanFilter, parseListQuery } from "@/shared/lib/pagination";
import type { ListResponse, UserDto } from "@/shared/types/api";
import { listUsers } from "../repositories/user-repository";

const SPEC = {
  sortable: ["createdAt", "name", "email"] as const,
  filters: ["q", "isActive"] as const,
};

export const GET = handleRoute(async (req) => {
  const query = parseListQuery(req.nextUrl.searchParams, SPEC);
  const isActive = parseBooleanFilter(query.filters.isActive, "isActive");

  const result = await listUsers(query, { q: query.filters.q, isActive });
  const body: ListResponse<UserDto> = result;
  return NextResponse.json(body);
});
