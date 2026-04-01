import fs from "node:fs/promises";
import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const START_PORT = 3000;
const BUILD_DIR = ".next";
const require = createRequire(import.meta.url);
const NEXT_BIN = require.resolve("next/dist/bin/next");

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const spawnOptions = {
      stdio: "inherit",
      shell: false,
      windowsHide: false,
      ...options,
    };

    const child = spawn(command, args, spawnOptions);

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function runNextCommand(args) {
  return runCommand(process.execPath, [NEXT_BIN, ...args]);
}

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1));
        return;
      }
      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(startPort));
    });

    server.listen(startPort, "0.0.0.0");
  });
}

async function main() {
  try {
    await fs.rm(BUILD_DIR, { recursive: true, force: true });
    console.log(`[safe-start] Cleared ${BUILD_DIR}`);

    console.log("[safe-start] Building production app...");
    await runNextCommand(["build", "--webpack"]);

    const port = await findAvailablePort(START_PORT);
    if (port !== START_PORT) {
      console.log(`[safe-start] Port ${START_PORT} is busy. Using port ${port} instead.`);
    } else {
      console.log(`[safe-start] Using port ${port}.`);
    }

    console.log("[safe-start] Starting production server...");
    await runNextCommand(["start", "-p", String(port)]);
  } catch (error) {
    console.error("[safe-start] Failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
