import http from "http";

const HOST = "127.0.0.1";
const PORT = Number(process.env.DOCAPP_WAIT_PORT ?? 5000);
const PATH = "/api/health";
const TIMEOUT_MS = 60_000;
const INTERVAL_MS = 300;

function check() {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: HOST, port: PORT, path: PATH, timeout: 2000 },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

const start = Date.now();

async function wait() {
  while (Date.now() - start < TIMEOUT_MS) {
    if (await check()) {
      console.log(`Backend ready at http://${HOST}:${PORT}`);
      return;
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  console.error(`Timed out waiting for backend at http://${HOST}:${PORT}${PATH}`);
  process.exit(1);
}

await wait();
