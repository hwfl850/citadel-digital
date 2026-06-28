#!/usr/bin/env node
// Capture full-page screenshots of the local site for UI review.
//
// Boots the preview server on an ephemeral port, screenshots every page at
// desktop + mobile widths, and writes PNGs to .review/ for an agent to read
// back and inspect.
//
// Usage:
//   node tools/screenshot.js                 # all pages, desktop + mobile
//   node tools/screenshot.js /services.html  # one or more specific paths
//
// Requires: npx playwright install chromium  (one-time browser download)

const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".review");

const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/services.html", "/about.html"];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function waitForServer(port, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.on("connect", () => { sock.end(); resolve(); });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error("server did not start"));
        else setTimeout(tryConnect, 150);
      });
    };
    tryConnect();
  });
}

(async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.error("Playwright not installed. Run:\n  npm install\n  npx playwright install chromium");
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort();

  const server = spawn(process.execPath, [path.join(__dirname, "serve.js"), String(port)], {
    stdio: "inherit",
  });

  try {
    await waitForServer(port);
    const browser = await chromium.launch();

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      for (const route of PAGES) {
        const url = `http://localhost:${port}${route}`;
        await page.goto(url, { waitUntil: "networkidle" });

        // The pages reveal content on scroll via IntersectionObserver
        // (elements start at opacity:0). Scroll through the whole page to
        // trigger every reveal, then return to top before the full-page shot —
        // otherwise below-the-fold sections capture as blank.
        await page.evaluate(async () => {
          const step = window.innerHeight * 0.8;
          for (let y = 0; y <= document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
          await new Promise((r) => setTimeout(r, 250));
        });

        const slug = route === "/" ? "home" : route.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
        const file = path.join(OUT, `${slug}.${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log("✓", path.relative(ROOT, file));
      }
      await context.close();
    }

    await browser.close();
    console.log(`\nScreenshots in ${path.relative(ROOT, OUT)}/ — read the PNGs to review the UI.`);
  } finally {
    server.kill();
  }
})();
