import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { privateStateDirectory } from "./state-directory.mjs";
import { fileURLToPath } from "node:url";
const packageDir = fileURLToPath(new URL("..", import.meta.url));
const repository = resolve(packageDir, "../..");
const state = privateStateDirectory(process.env.SERVICE_STATE_DIR, repository);
const bin = resolve(packageDir, "node_modules/wrangler/bin/wrangler.js");
const env = { ...process.env, WRANGLER_SEND_METRICS: "false" };
function run(args) {
  return new Promise((ok, bad) => {
    const p = spawn(process.execPath, [bin, ...args], {
      stdio: "inherit",
      env,
      cwd: packageDir,
    });
    p.on("exit", (c) =>
      c === 0 ? ok() : bad(new Error(`Wrangler exit ${c}`)),
    );
  });
}
await run([
  "d1",
  "migrations",
  "apply",
  "SERVICE_DB",
  "--local",
  "--persist-to",
  state,
]);
const p = spawn(
  process.execPath,
  [
    bin,
    "dev",
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    "8789",
    "--persist-to",
    state,
    "--var",
    "SERVICE_MODE:loopback",
    "--var",
    process.env.SERVICE_ENABLE_APPROVED_AZURE === "true"
      ? "AZURE_ENABLED:true"
      : "AZURE_ENABLED:false",
  ],
  { stdio: "inherit", env, cwd: packageDir },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => p.kill(signal));
p.on("exit", (c) => process.exit(c ?? 1));
