import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const landingRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(landingRoot, "..");
const clientRoot = resolve(repoRoot, "courier-cart-client");
const landingDist = resolve(landingRoot, "dist");
const clientDist = resolve(clientRoot, "dist");
const embeddedClientDist = resolve(landingDist, "client");

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || landingRoot,
      env: { ...process.env, ...options.env },
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

await run("npx", ["vite", "build"], { cwd: landingRoot });

if (!existsSync(resolve(clientRoot, "package.json"))) {
  console.warn("courier-cart-client was not found; landing build completed without embedded client.");
  process.exit(0);
}

if (!existsSync(resolve(clientRoot, "node_modules"))) {
  await run("npm", ["install", "--include=dev", "--cache", process.env.NPM_CONFIG_CACHE || "/tmp/npm-cache"], {
    cwd: clientRoot,
  });
}

await run("npm", ["run", "build"], {
  cwd: clientRoot,
  env: {
    VITE_APP_BASE_PATH: "/client/",
    VITE_LANDING_URL: "/",
  },
});

await rm(embeddedClientDist, { recursive: true, force: true });
await cp(clientDist, embeddedClientDist, { recursive: true });

console.log("Embedded client build copied to landing/dist/client.");
