// Contract test (DPSP-24): kontrak OpenAPI harus valid sebagai dokumen YAML
// dan memuat komponen standar + endpoint contoh terdokumentasi penuh.
// Ini "test terkait" untuk deliverable kontrak — mencegah regresi YAML/struktur
// yang mudah lolos review manual.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

interface OpenApiDoc {
  openapi: string;
  paths: Record<string, Record<string, { responses: Record<string, unknown> }>>;
  components: { schemas: Record<string, unknown>; parameters: Record<string, unknown> };
}

function loadContract(rel: string): OpenApiDoc {
  return parse(readFileSync(join(process.cwd(), rel), "utf8")) as OpenApiDoc;
}

describe("contracts/openapi.yaml", () => {
  const doc = loadContract("contracts/openapi.yaml");

  it("is an OpenAPI 3.1 document", () => {
    expect(doc.openapi).toBe("3.1.0");
  });

  it("defines the standard components (error envelope, pagination, list meta)", () => {
    for (const schema of ["ApiErrorBody", "ListMeta", "UserListResponse"]) {
      expect(doc.components.schemas, `schema ${schema}`).toHaveProperty(schema);
    }
    for (const param of ["Page", "PageSize", "Sort"]) {
      expect(doc.components.parameters, `parameter ${param}`).toHaveProperty(param);
    }
  });

  it("documents the example endpoint GET /users with success and all error responses", () => {
    const get = doc.paths["/users"]?.get;
    expect(get).toBeDefined();
    for (const status of ["200", "400", "401", "500"]) {
      expect(get!.responses, `/users GET response ${status}`).toHaveProperty(status);
    }
  });
});

describe("contracts/module-template.yaml", () => {
  it("is a valid YAML OpenAPI 3.1 template", () => {
    expect(loadContract("contracts/module-template.yaml").openapi).toBe("3.1.0");
  });
});
