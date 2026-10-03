import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
const port = Number(process.env.PORT || 8000);
const server = http
  .createServer(async (request, response) => {
    try {
      const name = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const target = path.resolve(
        root,
        "." + (name === "/" ? "/index.html" : name),
      );
      if (
        !target.startsWith(root) ||
        /(?:^|\/)\.|node_modules/.test(name) ||
        !mime[path.extname(target)]
      ) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const body = await readFile(target);
      response
        .writeHead(200, {
          "Content-Type": mime[path.extname(target)],
          "Cache-Control": "no-store",
        })
        .end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`SV Zweckel: http://127.0.0.1:${server.address().port}`),
  );
