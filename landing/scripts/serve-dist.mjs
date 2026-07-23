import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const indexFile = join(root, "index.html");
const port = Number(process.env.PORT || 3000);

const mimeTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function sendFile(response, filePath) {
  const isAsset = filePath.startsWith(join(root, "assets"));
  response.setHeader("Content-Type", mimeTypes.get(extname(filePath)) || "application/octet-stream");
  response.setHeader("Cache-Control", isAsset ? "public, max-age=31536000, immutable" : "no-cache");
  createReadStream(filePath).pipe(response);
}

async function resolveRequestPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = resolve(join(root, normalizedPath));

  if (!requestedPath.startsWith(root)) {
    return null;
  }

  try {
    const fileStats = await stat(requestedPath);
    if (fileStats.isFile()) {
      return requestedPath;
    }
  } catch {
    return existsSync(indexFile) ? indexFile : null;
  }

  return existsSync(indexFile) ? indexFile : null;
}

const server = createServer(async (request, response) => {
  if (!existsSync(indexFile)) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("RouteShip landing build not found. Run npm run build first.");
    return;
  }

  const filePath = await resolveRequestPath(request.url || "/");
  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  response.statusCode = 200;
  sendFile(response, filePath);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`RouteShip landing is serving dist on port ${port}`);
});
