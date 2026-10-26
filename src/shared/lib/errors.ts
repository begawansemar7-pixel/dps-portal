// Error handling standar untuk semua API route.
// Aturan: lempar AppError dari service/repository; wrapper route yang
// mengubahnya menjadi envelope JSON konsisten (lihat ./api.ts).

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode | "INTERNAL";
    message: string;
    details?: unknown;
  };
  request_id: string;
}

/** Error tak dikenal tidak boleh membocorkan detail internal ke klien. */
export function buildErrorBody(err: unknown, requestId: string): { body: ApiErrorBody; status: number } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
        request_id: requestId,
      },
    };
  }
  return {
    status: 500,
    body: {
      error: { code: "INTERNAL", message: "Internal server error" },
      request_id: requestId,
    },
  };
}
