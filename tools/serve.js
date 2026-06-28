#!/usr/bin/env node
// Local preview server for the Citadel Digital site.
//
// Serves the repo root statically, but strips Jekyll front matter (the
// `---` ... `---` block at the top of each .html file) on the fly so pages
// render exactly like they do on GitHub Pages — without needing Ruby/Jekyll.
//
// Usage: node tools/serve.js [port]   (default 4000)

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.argv[2] || process.env.PORT || 4000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

// Strip a leading Jekyll YAML front matter block, if present.
function stripFrontMatter(html) {
  if (!html.startsWith("---")) return html;
  const end = html.indexOf("\n---", 3);
  if (end === -1) return html;
  const after = html.indexOf("\n", end + 1);
  return html.slice(after + 1).replace(/^\s+/, "");
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";

  // Resolve and guard against path traversal outside ROOT.
  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  // Allow extensionless links to resolve to .html (Jekyll-style).
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + ".html")) {
    filePath += ".html";
  }

  fs.stat(filePath, (err, stat) => {
    if (err || stat.isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404</h1><p>Not found: " + urlPath + "</p>");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    if (ext === ".html") {
      const html = stripFrontMatter(fs.readFileSync(filePath, "utf8"));
      res.writeHead(200, { "Content-Type": type });
      res.end(html);
    } else {
      res.writeHead(200, { "Content-Type": type });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Citadel Digital preview → http://localhost:${PORT}`);
  console.log("Pages: /  /services.html  /about.html");
});
