import { describe, expect, it } from "vitest";
import { AppError, buildErrorBody } from "./errors";

describe("AppError", () => {
  it("maps codes to HTTP status", () => {
    expect(new AppError("NOT_FOUND", "missing").status).toBe(404);
    expect(new AppError("UNAUTHORIZED", "nope").status).toBe(401);
    expect(new AppError("BAD_REQUEST", "bad").status).toBe(400);
    expect(new AppError("CONFLICT", "dupe").status).toBe(409);
  });
});

describe("buildErrorBody", () => {
  it("exposes AppError code and message", () => {
    const { body, status } = buildErrorBody(new AppError("NOT_FOUND", "user not found"), "req-1");
    expect(status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("user not found");
    expect(body.request_id).toBe("req-1");
  });

  it("hides internals of unknown errors", () => {
    const { body, status } = buildErrorBody(new Error("db password is hunter2"), "req-2");
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.message).toBe("Internal server error");
  });
});
