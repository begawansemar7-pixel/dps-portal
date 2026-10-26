// Wrapper standar untuk API route: request-id, structured log per request,
// dan mapping error ke envelope JSON konsisten.
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse, connection } from "next/server";
import { AppError, buildErrorBody } from "./errors";
import { logger } from "./logger";

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

export function handleRoute(handler: RouteHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Menandai handler sebagai dynamic (wajib di bawah cacheComponents):
    // API tidak pernah di-cache/di-prerender saat build.
    await connection();
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    const startedAt = Date.now();

    try {
      const res = await handler(req);
      res.headers.set("x-request-id", requestId);
      logger.info(
        {
          request_id: requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          status: res.status,
          duration_ms: Date.now() - startedAt,
        },
        "request completed",
      );
      return res;
    } catch (err) {
      const { body, status } = buildErrorBody(err, requestId);
      const logPayload = {
        request_id: requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status,
        duration_ms: Date.now() - startedAt,
      };
      if (err instanceof AppError) {
        logger.warn({ ...logPayload, code: err.code }, "request failed");
      } else {
        logger.error({ ...logPayload, err }, "unhandled error");
      }
      const res = NextResponse.json(body, { status });
      res.headers.set("x-request-id", requestId);
      return res;
    }
  };
}
