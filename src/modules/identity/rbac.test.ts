import { describe, expect, it } from "vitest";
import { hasAnyRole, hasRole } from "./rbac";

const roles = [{ key: "ADMIN" }, { key: "MEMBER" }];

describe("hasRole", () => {
  it("finds an assigned role", () => {
    expect(hasRole(roles, "ADMIN")).toBe(true);
    expect(hasRole(roles, "FINANCE")).toBe(false);
  });

  it("handles empty role list", () => {
    expect(hasRole([], "ADMIN")).toBe(false);
  });
});

describe("hasAnyRole", () => {
  it("accepts when at least one role matches", () => {
    expect(hasAnyRole(roles, ["FINANCE", "MEMBER"])).toBe(true);
    expect(hasAnyRole(roles, ["FINANCE", "HR"])).toBe(false);
  });
});
