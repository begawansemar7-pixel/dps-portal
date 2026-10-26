import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  compositeOver,
  contrastRatio,
  oklchToSrgb,
  parseOklch,
} from "./color";

/*
 * Verifikasi kontras design token (DPSP-28) langsung dari sumber kebenaran:
 * `src/app/globals.css`. Mengubah nilai token tanpa lulus test ini berarti
 * melanggar WCAG 2.2 AA.
 */

const CSS_PATH = new URL("../app/globals.css", import.meta.url);
const TEXT_MIN = 4.5; // WCAG 2.2 AA — teks normal (1.4.3)
const UI_MIN = 3; // WCAG 2.2 AA — batas komponen non-teks (1.4.11)

type Theme = "light" | "dark";

function extractBlock(css: string, selector: string): string {
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`);
  const m = re.exec(css);
  if (!m) throw new Error(`Blok ${selector} tidak ditemukan di globals.css`);
  return m[1];
}

function parseTokens(block: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    tokens.set(m[1], m[2].trim());
  }
  return tokens;
}

const css = readFileSync(CSS_PATH, "utf8");
const themes: Record<Theme, Map<string, string>> = {
  light: parseTokens(extractBlock(css, ":root")),
  dark: parseTokens(extractBlock(css, "\\.dark")),
};

/** Ambil warna sRGB token; token ber-alpha dikomposit di atas `over`. */
function srgb(theme: Theme, name: string, over?: string): [number, number, number] {
  const tokens = themes[theme];
  const raw = tokens.get(name);
  if (raw === undefined) {
    throw new Error(`Token --${name} tidak ada di mode ${theme}`);
  }
  const [r, g, b, alpha] = oklchToSrgb(parseOklch(raw));
  if (alpha >= 1) return [r, g, b];
  if (!over) {
    throw new Error(`Token --${name} punya alpha; wajib diberi permukaan composite`);
  }
  return compositeOver([r, g, b, alpha], srgb(theme, over));
}

function ratio(theme: Theme, fg: string, bg: string): number {
  return contrastRatio(srgb(theme, fg), srgb(theme, bg));
}

/** Pasangan teks yang wajib ≥ 4.5:1 di setiap mode (WCAG 1.4.3). */
const TEXT_PAIRS: Array<[string, string]> = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
  // Warna status sebagai teks di permukaan (pola badge `text-destructive`,
  // `text-success`, dst. yang dipakai komponen shadcn).
  ["destructive", "background"],
  ["success", "background"],
  ["info", "background"],
  ["warning-text", "background"],
  ["warning-text", "card"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
];

/** Pasangan batas komponen yang wajib ≥ 3:1 di setiap mode (WCAG 1.4.11). */
const UI_PAIRS: Array<[string, string]> = [
  ["input", "background"],
  ["ring", "background"],
  ["chart-1", "card"],
  ["chart-2", "card"],
  ["chart-3", "card"],
  ["chart-4", "card"],
  ["chart-5", "card"],
];

describe.each([["light"], ["dark"]] as const)("token kontras — mode %s", (theme) => {
  it.each(TEXT_PAIRS)("teks %s di atas %s ≥ 4.5:1", (fg, bg) => {
    expect(ratio(theme, fg, bg)).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it.each(UI_PAIRS)("%s terhadap %s ≥ 3:1", (fg, bg) => {
    expect(ratio(theme, fg, bg)).toBeGreaterThanOrEqual(UI_MIN);
  });
});

describe("kelengkapan token", () => {
  const REQUIRED = [
    // Semantik warna
    "background", "foreground", "card", "card-foreground", "popover",
    "popover-foreground", "primary", "primary-foreground", "secondary",
    "secondary-foreground", "muted", "muted-foreground", "accent",
    "accent-foreground", "destructive", "destructive-foreground", "success",
    "success-foreground", "warning", "warning-foreground", "warning-text",
    "info", "info-foreground", "border", "input", "ring", "chart-1", "chart-2",
    "chart-3", "chart-4", "chart-5", "sidebar", "sidebar-foreground",
    "sidebar-primary", "sidebar-primary-foreground", "sidebar-accent",
    "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
    // Tipografi, spacing, radius, elevation
    "radius",
  ];

  it.each(REQUIRED)("--%s terdefinisi di light DAN dark", (name) => {
    expect(themes.light.has(name)).toBe(true);
    expect(themes.dark.has(name)).toBe(true);
  });

  it("light dan dark punya set token yang sama persis", () => {
    expect([...themes.dark.keys()].sort()).toEqual([...themes.light.keys()].sort());
  });

  it("skala tipografi xs–5xl terdefinisi dengan line-height pasangan", () => {
    for (const step of ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"]) {
      expect(css).toMatch(new RegExp(`--text-${step}\\s*:`));
      expect(css).toMatch(new RegExp(`--text-${step}--line-height\\s*:`));
    }
  });

  it("grid spacing 4px dan target sentuh 44px terdefinisi", () => {
    expect(css).toMatch(/--spacing:\s*0\.25rem/);
    expect(css).toMatch(/--spacing-touch:\s*2\.75rem/);
  });

  it("elevation xs–xl terdefinisi di kedua mode", () => {
    for (const level of ["xs", "sm", "md", "lg", "xl"]) {
      expect(themes.light.has(`elevation-${level}`)).toBe(true);
      expect(themes.dark.has(`elevation-${level}`)).toBe(true);
    }
  });

  it("token font terhubung ke next/font", () => {
    // Variabel next/font harus bernama --font-sans / --font-mono agar
    // pemetaan @theme inline di globals.css valid.
    const layout = readFileSync(
      new URL("../app/layout.tsx", import.meta.url),
      "utf8",
    );
    expect(layout).toContain('variable: "--font-sans"');
    expect(layout).toContain('variable: "--font-mono"');
  });
});

describe("sanitas konversi warna", () => {
  it("parseOklch menangani alpha persen dan desimal", () => {
    expect(parseOklch("oklch(1 0 0 / 10%)").alpha).toBeCloseTo(0.1);
    expect(parseOklch("oklch(0.5 0.1 100 / 0.4)").alpha).toBeCloseTo(0.4);
    expect(parseOklch("oklch(0.5 0.1 100)").alpha).toBe(1);
  });

  it("putih vs hitam ≈ 21:1", () => {
    const [wr, wg, wb] = oklchToSrgb(parseOklch("oklch(1 0 0)"));
    const [br, bg, bb] = oklchToSrgb(parseOklch("oklch(0 0 0)"));
    expect(contrastRatio([wr, wg, wb], [br, bg, bb])).toBeCloseTo(21, 0);
  });
});
