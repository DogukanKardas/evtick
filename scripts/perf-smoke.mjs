/**
 * HTTP performance smoke — runs against NEXT_PUBLIC_SITE_URL
 * Usage: node scripts/perf-smoke.mjs
 */
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.test.local") });
config({ path: path.resolve(process.cwd(), ".env.local") });

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const THRESHOLDS_MS = {
  "/login": Number(process.env.PERF_LOGIN_P95_MS ?? (process.env.CI ? 2000 : 3000)),
  "/dashboard": Number(process.env.PERF_DASHBOARD_P95_MS ?? (process.env.CI ? 1500 : 3000)),
  "/system": Number(process.env.PERF_SYSTEM_P95_MS ?? (process.env.CI ? 2500 : 4000)),
  "/system/tickets": Number(
    process.env.PERF_SYSTEM_TICKETS_P95_MS ?? (process.env.CI ? 3000 : 5000)
  ),
};

async function measurePath(pathname) {
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    let res;
    try {
      res = await fetch(`${BASE}${pathname}`, { redirect: "manual" });
    } catch (err) {
      if (err.cause?.code === "ECONNREFUSED" || err.code === "ECONNREFUSED") {
        console.warn(`Skip perf smoke: server not running at ${BASE}`);
        return null;
      }
      throw err;
    }
    samples.push(performance.now() - start);
    if (!res.ok && res.status !== 307 && res.status !== 308) {
      throw new Error(`${pathname} returned ${res.status}`);
    }
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length * 0.95)] ?? samples.at(-1);
}

async function main() {
  let failed = false;
  let skipped = false;

  for (const [route, limit] of Object.entries(THRESHOLDS_MS)) {
    try {
      const p95 = await measurePath(route);
      if (p95 === null) {
        skipped = true;
        continue;
      }
      if (p95 > limit) {
        console.error(`FAIL ${route} p95=${p95.toFixed(0)}ms > ${limit}ms`);
        failed = true;
      } else {
        console.log(`OK ${route} p95=${p95.toFixed(0)}ms`);
      }
    } catch (err) {
      console.error(`FAIL ${route}:`, err.message);
      failed = true;
    }
  }

  if (failed) process.exit(1);
  if (skipped) {
    console.log("Perf smoke skipped (no server).");
    return;
  }
  console.log("Perf smoke passed.");
}

main();
