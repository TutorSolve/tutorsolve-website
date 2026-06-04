#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const runtimeEnvPath = path.join(rootDir, "js", "runtime-env.js");
const backendUrl = (process.env.FRONTEND_BACKEND_URL || "").trim().replace(/\/+$/, "");
const port = process.env.PORT || "3000";

const runtimeEnvContents = `// Generated at runtime by frontend/scripts/start-static.js.
window.__TS_ENV_BACKEND_URL = ${JSON.stringify(backendUrl)};
`;

fs.writeFileSync(runtimeEnvPath, runtimeEnvContents, "utf8");

const localServeBinary = path.join(
  rootDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "serve.cmd" : "serve"
);

const hasLocalServe = fs.existsSync(localServeBinary);
const command = hasLocalServe ? localServeBinary : "npx";
const args = hasLocalServe
  ? [".", "-l", port, "-c", "serve.json"]
  : ["--yes", "serve", ".", "-l", port, "-c", "serve.json"];

const child = spawn(command, args, {
  cwd: rootDir,
  stdio: "inherit",
  shell: process.platform === "win32"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code || 0);
});

child.on("error", (err) => {
  console.error("Failed to start static server:", err.message);
  process.exit(1);
});
