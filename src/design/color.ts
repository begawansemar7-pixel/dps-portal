/**
 * Konversi oklch → sRGB dan perhitungan kontras WCAG.
 *
 * Dipakai oleh `tokens.test.ts` untuk memverifikasi bahwa token warna di
 * `src/app/globals.css` memenuhi WCAG 2.2 AA (teks ≥ 4.5:1, non-teks ≥ 3:1)
 * di kedua mode light/dark — tanpa dependensi eksternal.
 */

export type Oklch = { l: number; c: number; h: number; alpha: number };

const OKLCH_RE =
  /oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg)?)\s*(?:\/\s*([\d.]+%?))?\s*\)/;

/** Parse string warna `oklch(L C H [/ alpha])` (satu-satunya format token CSS di globals.css). */
export function parseOklch(value: string): Oklch {
  const m = OKLCH_RE.exec(value.trim());
  if (!m) {
    throw new Error(`Bukan warna oklch yang valid: "${value}"`);
  }
  const alphaRaw = m[4];
  let alpha = 1;
  if (alphaRaw !== undefined) {
    alpha = alphaRaw.endsWith("%")
      ? Number.parseFloat(alphaRaw) / 100
      : Number.parseFloat(alphaRaw);
  }
  return {
    l: Number.parseFloat(m[1]),
    c: Number.parseFloat(m[2]),
    h: Number.parseFloat(m[3].replace("deg", "")),
    alpha,
  };
}

/** oklch → [r, g, b] linear sRGB (tanpa gamma), nilai di-clamp ke gamut 0..1. */
function oklchToLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    clamp(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    clamp(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  ];
}

/** Gamma encode linear → sRGB (0..1). */
function gammaEncode(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** oklch → [r, g, b] sRGB gamma-encoded 0..1 + alpha. */
export function oklchToSrgb(color: Oklch): [number, number, number, number] {
  const [r, g, b] = oklchToLinearSrgb(color).map(gammaEncode);
  return [r, g, b, color.alpha];
}

/** Composite warna dengan alpha di atas warna dasar (ruang sRGB, seperti browser). */
export function compositeOver(
  fg: [number, number, number, number],
  bg: [number, number, number],
): [number, number, number] {
  const [fr, fgc, fb, a] = fg;
  return [
    fr * a + bg[0] * (1 - a),
    fgc * a + bg[1] * (1 - a),
    fb * a + bg[2] * (1 - a),
  ];
}

/** Luminansi relatif WCAG (dari sRGB gamma-encoded 0..1). */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Rasio kontras WCAG 2.x antara dua warna sRGB (0..1), rentang 1..21. */
export function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}