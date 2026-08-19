import http from "node:http";

const routes = [
  "/",
  "/shop",
  "/collections/all",
  "/collections/pants",
  "/collections/t-shirts",
  "/collections/jackets",
  "/search?q=denim",
  "/about",
  "/contact",
  "/faq",
  "/shipping",
  "/return-policy",
  "/privacy-policy",
  "/terms",
  "/cart",
  "/checkout",
  "/track-order",
  "/wishlist",
  "/account",
  "/account/orders",
  "/account/addresses",
  "/login",
  "/register",
  "/forgot-password",
];

async function checkRoute(route) {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${route}`, (res) => {
      const duration = Date.now() - start;
      resolve({
        route,
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    });
    req.on("error", (err) => {
      resolve({
        route,
        status: "ERROR",
        error: err.message,
      });
    });
  });
}

async function run() {
  console.log("==================================================");
  console.log("RUST & REVIVE — STOREFRONT ROUTE VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  for (const route of routes) {
    const result = await checkRoute(route);
    if (result.status === 200 || result.status === 307 || result.status === 308) {
      console.log(`[PASS] ${result.route.padEnd(28)} -> HTTP ${result.status} (${result.duration})`);
      passed++;
    } else {
      console.error(`[FAIL] ${result.route.padEnd(28)} -> HTTP ${result.status} (${result.duration || result.error})`);
      failed++;
    }
  }

  console.log("==================================================");
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

run();
