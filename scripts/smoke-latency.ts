// Smoke test latency NFR-003 (DPSP-24): mengukur P95 endpoint contoh
// GET /api/v1/users terhadap budget NFR-003 (P95 <= 500 ms).
//
// Cara pengukuran (rujukan README §6):
//   1. Jalankan server PRODUKSI: `npm run build && npm start` (port 3000),
//      dengan database sudah migrate + seed.
//   2. Jalankan skrip ini: `npm run smoke:latency`
//      (opsional: --base-url http://localhost:3000 --requests 100 --warmup 10)
//   3. Skrip melakukan request SEKUENSIAL (tanpa concurrency) via loopback,
//      membuang `--warmup` request pertama (cold start JIT/cache), lalu
//      menghitung P50/P95/max dari sisa request.
// Angka yang dihasilkan = latency aplikasi murni (loopback, tanpa jaringan
// publik/proxy) — yang mewakili budget NFR-003 untuk endpoint portal.
// Exit code 1 bila P95 melewati budget.
const args = process.argv.slice(2);
function arg(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const baseUrl = arg("base-url", process.env.SMOKE_BASE_URL ?? "http://localhost:3000");
const path = arg("path", "/api/v1/users?pageSize=10");
const requests = Number(arg("requests", "100"));
const warmup = Number(arg("warmup", "10"));
const budgetMs = Number(arg("budget-ms", "500"));

async function measure(): Promise<void> {
  const url = `${baseUrl}${path}`;
  console.log(`Smoke latency NFR-003: GET ${url}`);
  console.log(`requests=${requests} warmup=${warmup} budget=P95<=${budgetMs}ms (sekuenal, loopback)`);

  // Warmup — dibuang dari statistik.
  for (let i = 0; i < warmup; i++) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`warmup request gagal: HTTP ${res.status}`);
    await res.arrayBuffer();
  }

  const samples: number[] = [];
  for (let i = 0; i < requests; i++) {
    const started = performance.now();
    const res = await fetch(url);
    await res.arrayBuffer();
    const elapsed = performance.now() - started;
    if (!res.ok) throw new Error(`request ke-${i + 1} gagal: HTTP ${res.status}`);
    samples.push(elapsed);
  }

  samples.sort((a, b) => a - b);
  const pct = (p: number) => samples[Math.min(samples.length - 1, Math.ceil((p / 100) * samples.length) - 1)];
  const p50 = pct(50);
  const p95 = pct(95);
  const max = samples[samples.length - 1];

  console.log(
    JSON.stringify(
      { path, requests, warmup, p50_ms: +p50.toFixed(1), p95_ms: +p95.toFixed(1), max_ms: +max.toFixed(1), budget_ms: budgetMs },
      null,
      2,
    ),
  );

  if (p95 > budgetMs) {
    console.error(`FAIL: P95 ${p95.toFixed(1)}ms > budget ${budgetMs}ms (NFR-003)`);
    process.exit(1);
  }
  console.log(`PASS: P95 ${p95.toFixed(1)}ms <= budget ${budgetMs}ms (NFR-003)`);
}

measure().catch((err) => {
  console.error(err);
  process.exit(1);
});
