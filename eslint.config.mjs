import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Batas modul (README §2): modul domain TIDAK boleh mengimpor internal modul
// lain (api/ services/ repositories/). Integrasi antar domain lewat DTO di
// src/shared/types atau tabel database + audit_logs.
const DOMAINS = [
  "identity",
  "organization",
  "talent",
  "assignment",
  "delivery",
  "workload",
  "reporting",
  "knowledge",
  "financial",
  "ai",
];

const moduleBoundaries = DOMAINS.map((domain) => ({
  files: [`src/modules/${domain}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@/modules/*/api/*",
              "@/modules/*/services/*",
              "@/modules/*/repositories/*",
              `!@/modules/${domain}/**`,
            ],
            message: `Import lintas-domain dilarang (batas modul ${domain}). Gunakan DTO di @/shared/types atau akses lewat DB/audit_logs (README §2).`,
          },
        ],
      },
    ],
  },
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...moduleBoundaries,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
