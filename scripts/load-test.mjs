const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

const TARGETS = [
  { path: "/", name: "Homepage" },
  { path: "/api/health", name: "Health Liveness" },
  { path: "/api/health?details=true", name: "Health Diagnostic" },
  { path: "/wishlist", name: "Wishlist Storefront" },
  { path: "/track-order", name: "Track Order Portal" },
];

async function measureRequest(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RustRevive-LoadTest-Suite/1.0",
        Accept: "text/html,application/json",
      },
    });
    const latency = performance.now() - start;
    return { ok: res.ok, status: res.status, latency };
  } catch (err) {
    const latency = performance.now() - start;
    return { ok: false, status: 0, latency, error: err.message };
  }
}

async function runLoadTest(concurrency = 10, totalRequests = 50) {
  console.log("==================================================");
  console.log("RUST & REVIVE — PRODUCTION LOAD & BENCHMARK SUITE");
  console.log(`Target: ${BASE_URL} | Concurrency: ${concurrency} | Total: ${totalRequests}`);
  console.log("==================================================");

  for (const target of TARGETS) {
    const url = `${BASE_URL}${target.path}`;
    console.log(`\nTesting ${target.name} (${target.path})...`);

    const latencies = [];
    let successCount = 0;
    let failCount = 0;

    const batches = Math.ceil(totalRequests / concurrency);
    const testStart = performance.now();

    for (let b = 0; b < batches; b++) {
      const promises = Array.from({ length: concurrency }).map(() => measureRequest(url));
      const results = await Promise.all(promises);

      for (const r of results) {
        latencies.push(r.latency);
        if (r.ok) successCount++;
        else failCount++;
      }
    }

    const testDuration = (performance.now() - testStart) / 1000;
    latencies.sort((a, b) => a - b);

    const min = latencies[0].toFixed(1);
    const max = latencies[latencies.length - 1].toFixed(1);
    const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
    const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(1);
    const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(1);
    const rps = (totalRequests / testDuration).toFixed(1);

    console.log(`  Requests: ${totalRequests} | Success: ${successCount} | Failed: ${failCount}`);
    console.log(`  Throughput: ${rps} req/sec | Min: ${min}ms | Avg: ${avg}ms | p50: ${p50}ms | p95: ${p95}ms | Max: ${max}ms`);
  }

  console.log("\n==================================================");
  console.log("✅ Load test benchmark completed successfully!");
  console.log("==================================================");
}

runLoadTest();
