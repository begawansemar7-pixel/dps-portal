import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parseBooleanFilter,
  parseListQuery,
} from "./pagination";

const spec = { sortable: ["createdAt", "name", "email"] as const, filters: ["q", "isActive"] };

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("parseListQuery", () => {
  it("returns defaults when no query params given", () => {
    const q = parseListQuery(params(""), spec);
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(q.sort).toEqual({ field: "createdAt", direction: "desc" });
    expect(q.filters).toEqual({});
  });

  it("parses page, pageSize, sort and whitelisted filters", () => {
    const q = parseListQuery(params("page=2&pageSize=20&sort=name:asc&q=ani&isActive=true"), spec);
    expect(q.page).toBe(2);
    expect(q.pageSize).toBe(20);
    expect(q.sort).toEqual({ field: "name", direction: "asc" });
    expect(q.filters).toEqual({ q: "ani", isActive: "true" });
  });

  it("ignores unknown query params", () => {
    const q = parseListQuery(params("evil=1&q=ani"), spec);
    expect(q.filters).toEqual({ q: "ani" });
  });

  it.each(["page=0", "page=-1", "page=abc", "page=1.5"])("rejects invalid page (%s)", (query) => {
    expect(() => parseListQuery(params(query), spec)).toThrowError(AppError);
    try {
      parseListQuery(params(query), spec);
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.code).toBe("BAD_REQUEST");
      expect(appErr.status).toBe(400);
      expect(appErr.details).toEqual([{ field: "page", message: "harus bilangan bulat >= 1" }]);
    }
  });

  it.each(["pageSize=0", `pageSize=${MAX_PAGE_SIZE + 1}`, "pageSize=abc"])(
    "rejects invalid pageSize (%s)",
    (query) => {
      expect(() => parseListQuery(params(query), spec)).toThrowError(AppError);
    },
  );

  it.each(["sort=name:up", "sort=passwordHash:asc", "sort=name"])(
    "rejects invalid sort (%s)",
    (query) => {
      expect(() => parseListQuery(params(query), spec)).toThrowError(AppError);
      try {
        parseListQuery(params(query), spec);
      } catch (err) {
        expect((err as AppError).details).toMatchObject([{ field: "sort" }]);
      }
    },
  );

  it("collects multiple validation errors in one details array", () => {
    try {
      parseListQuery(params("page=0&pageSize=999"), spec);
      expect.unreachable();
    } catch (err) {
      const details = (err as AppError).details as Array<{ field: string }>;
      expect(details.map((d) => d.field)).toEqual(["page", "pageSize"]);
    }
  });
});

describe("parseBooleanFilter", () => {
  it("passes through undefined and true/false", () => {
    expect(parseBooleanFilter(undefined, "isActive")).toBeUndefined();
    expect(parseBooleanFilter("true", "isActive")).toBe(true);
    expect(parseBooleanFilter("false", "isActive")).toBe(false);
  });

  it("rejects other values with BAD_REQUEST", () => {
    try {
      parseBooleanFilter("yes", "isActive");
      expect.unreachable();
    } catch (err) {
      expect((err as AppError).code).toBe("BAD_REQUEST");
      expect((err as AppError).details).toEqual([
        { field: "isActive", message: 'harus "true" atau "false"' },
      ]);
    }
  });
});
