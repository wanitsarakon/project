const path = require("node:path");
const { spawn } = require("node:child_process");
const net = require("node:net");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const FRONTEND_DIR = path.join(PROJECT_ROOT, "Frontend");
const BACKEND_DIR = path.join(PROJECT_ROOT, "backend");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    const onFail = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once("timeout", onFail);
    socket.once("error", onFail);
    socket.connect(port, host);
  });
}

async function waitForPort(port, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    if (await isPortOpen(port)) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

function spawnDetached(command, cwd, outFile, errFile) {
  const child = spawn(
    "cmd.exe",
    ["/c", command],
    {
      cwd,
      detached: true,
      stdio: [
        "ignore",
        outFile ? require("node:fs").openSync(outFile, "a") : "ignore",
        errFile ? require("node:fs").openSync(errFile, "a") : "ignore",
      ],
      windowsHide: true,
    },
  );
  child.unref();
}

async function ensureFrontendServer(port = 4173) {
  if (await isPortOpen(port)) return;

  spawnDetached(
    `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    FRONTEND_DIR,
    path.join(PROJECT_ROOT, ".artifacts", "manual_qa", "vite_preview.out.log"),
    path.join(PROJECT_ROOT, ".artifacts", "manual_qa", "vite_preview.err.log"),
  );

  const ready = await waitForPort(port);
  if (!ready) {
    throw new Error(`Frontend preview did not start on port ${port}`);
  }
}

async function ensureBackendServer(port = 18082) {
  if (await isPortOpen(port)) return;

  spawnDetached(
    `go run main.go`,
    BACKEND_DIR,
    path.join(PROJECT_ROOT, ".artifacts", "manual_qa", "backend.out.log"),
    path.join(PROJECT_ROOT, ".artifacts", "manual_qa", "backend.err.log"),
  );

  const ready = await waitForPort(port);
  if (!ready) {
    throw new Error(`Backend did not start on port ${port}`);
  }
}

module.exports = {
  ensureFrontendServer,
  ensureBackendServer,
};
