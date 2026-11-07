import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const PORT = Number.parseInt(process.env.PORT ?? "4173", 10);
const HOST = process.env.HOST ?? "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function sendText(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function safePath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (decoded.includes("\0")) return null;

  const requested = decoded === "/" ? "/index.html" : decoded;
  const filePath = resolve(join(ROOT, `.${requested}`));
  const insideRoot = filePath === ROOT || filePath.startsWith(ROOT + sep);

  return insideRoot ? filePath : null;
}

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    sendText(res, 405, "Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  } catch {
    sendText(res, 400, "Bad request");
    return;
  }

  const filePath = safePath(pathname);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let fileStat;
  try {
    fileStat = await fs.stat(filePath);
    if (fileStat.isDirectory()) {
      res.writeHead(302, { Location: `${pathname.replace(/\/?$/, "/")}index.html` });
      res.end();
      return;
    }
  } catch {
    sendText(res, 404, "Not found");
    return;
  }

  const contentType = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": fileStat.size,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => {
    res.destroy();
  });
  stream.pipe(res);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try: PORT=4174 node server.mjs`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log("");
  console.log("  Butterfly Effect");
  console.log(`  Serving ${ROOT}`);
  console.log(`  → http://${displayHost}:${PORT}`);
  console.log("");
  console.log("  Press Ctrl+C to stop.");
  console.log("");
});
