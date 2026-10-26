// GET /api/v1/health — liveness + koneksi database (contoh endpoint
// terdokumentasi di contracts/openapi.yaml).
import { NextResponse } from "next/server";
import { db } from "@/infrastructure/db";
import { handleRoute } from "@/shared/lib/api";
import type { HealthResponse } from "@/shared/types/api";

export const GET = handleRoute(async () => {
  let dbStatus: HealthResponse["db"] = "up";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "down";
  }

  const body: HealthResponse = {
    status: dbStatus === "up" ? "ok" : "degraded",
    db: dbStatus,
    version: process.env.npm_package_version ?? "0.1.0",
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: dbStatus === "up" ? 200 : 503 });
});
