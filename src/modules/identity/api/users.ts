// Contoh endpoint modul (identity): GET /api/v1/users
// Route handler app/ hanya me-re-export file ini (lihat konvensi README).
import { NextResponse } from "next/server";
import { handleRoute } from "@/shared/lib/api";
import type { ListResponse, UserDto } from "@/shared/types/api";
import { listUsers } from "../repositories/user-repository";

export const GET = handleRoute(async () => {
  const users = await listUsers();
  const body: ListResponse<UserDto> = { data: users };
  return NextResponse.json(body);
});
