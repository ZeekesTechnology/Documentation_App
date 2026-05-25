import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
} from "electron";
import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import http from "http";
import path from "path";
import { findAvailablePort } from "./findPort";
import {
  getLogDir,
  getPythonLaunchConfig,
  getRendererUrl,
} from "./paths";
import {
  checkForUpdates,
  downloadPendingUpdate,
  getCurrentVersion,
  runInstallerAndQuit,
} from "./updater";

const HEALTH_PATH = "/api/health";
const HEALTH_TIMEOUT_MS = 30_000;
const HEALTH_POLL_MS = 300;

let mainWindow: BrowserWindow | null = null;
let pythonProcess: ChildProcess | null = null;
let backendPort = 5000;
let quittingForUpdate = false;

function registerUpdateHandlers(): void {
  ipcMain.handle("update:get-version", () => getCurrentVersion());
  ipcMain.handle("update:is-packaged", () => app.isPackaged);

  ipcMain.handle("update:check", async () => checkForUpdates());

  ipcMain.handle("update:download-and-install", async () => {
    try {
      const installerPath = await downloadPendingUpdate((progress) => {
        mainWindow?.webContents.send("update:download-progress", progress);
      });

      quittingForUpdate = true;
      killPythonProcess();
      runInstallerAndQuit(installerPath);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to download and install the update.",
      };
    }
  });
}

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function getWindowIcon(): string | undefined {
  if (process.platform !== "win32") {
    return undefined;
  }

  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, "icon.ico")]
    : [path.resolve(__dirname, "..", "..", "build", "icon.ico")];

  return candidates.find((candidate) => fileExists(candidate));
}

async function logBuildInfo(port: number): Promise<void> {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/build-info",
        timeout: 2000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          try {
            const info = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              version?: string;
              bundle?: string;
            };
            appendLog(
              `UI build ${info.version ?? "unknown"} (${info.bundle ?? "unknown bundle"})`
            );
          } catch {
            appendLog("UI build info unavailable");
          }
          resolve();
        });
      }
    );

    req.on("error", () => {
      appendLog("UI build info request failed");
      resolve();
    });
    req.on("timeout", () => {
      req.destroy();
      resolve();
    });
  });
}

function appendLog(message: string): void {
  try {
    const logDir = getLogDir();
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, "app.log");
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFile, line, "utf8");
  } catch {
    // ignore logging failures
  }
}

function killPythonProcess(): void {
  if (!pythonProcess?.pid) {
    pythonProcess = null;
    return;
  }

  const pid = pythonProcess.pid;
  appendLog(`Stopping Python process (pid ${pid})`);

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/f", "/t"], { shell: true });
  } else {
    pythonProcess.kill("SIGTERM");
  }

  pythonProcess = null;
}

function waitForHealth(port: number): Promise<void> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const poll = (): void => {
      const req = http.get(
        {
          hostname: "127.0.0.1",
          port,
          path: HEALTH_PATH,
          timeout: 2000,
        },
        (res) => {
          res.resume();
          if (res.statusCode === 200) {
            resolve();
            return;
          }
          schedule();
        }
      );

      req.on("error", schedule);
      req.on("timeout", () => {
        req.destroy();
        schedule();
      });

      function schedule(): void {
        if (Date.now() >= deadline) {
          reject(new Error("Backend failed to start within 30 seconds"));
          return;
        }
        setTimeout(poll, HEALTH_POLL_MS);
      }
    };

    poll();
  });
}

async function startPythonBackend(): Promise<number> {
  backendPort = await findAvailablePort([5000, 5001, 5002, 8765]);
  const config = getPythonLaunchConfig(backendPort);

  appendLog(
    `Starting backend: ${config.command} ${config.args.join(" ")} (port ${backendPort})`
  );

  pythonProcess = spawn(config.command, config.args, {
    cwd: config.cwd,
    env: config.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  pythonProcess.stdout?.on("data", (chunk: Buffer) => {
    appendLog(`[python stdout] ${chunk.toString().trim()}`);
  });

  pythonProcess.stderr?.on("data", (chunk: Buffer) => {
    appendLog(`[python stderr] ${chunk.toString().trim()}`);
  });

  pythonProcess.on("error", (err) => {
    appendLog(`[python error] ${err.message}`);
  });

  pythonProcess.on("exit", (code, signal) => {
    appendLog(`Python exited (code=${code}, signal=${signal})`);
    pythonProcess = null;
  });

  await waitForHealth(backendPort);
  appendLog(`Backend ready on port ${backendPort}`);
  return backendPort;
}

function useExternalBackend(): boolean {
  return !app.isPackaged && process.env.NODE_ENV === "development";
}

async function createWindow(): Promise<void> {
  let port = parseInt(process.env.DOCAPP_PORT ?? "5000", 10);

  if (useExternalBackend()) {
    appendLog(`Using external backend on port ${port}`);
    await waitForHealth(port);
  } else {
    port = await startPythonBackend();
  }

  const url = getRendererUrl(port);
  const appVersion = getCurrentVersion();
  const iconPath = getWindowIcon();

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    title: "MenschDocs",
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: `persist:menschdocs-v${appVersion}`,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  const session = mainWindow.webContents.session;
  await session.clearCache();
  await session.clearStorageData({
    storages: ["serviceworkers", "cachestorage"],
  });

  await mainWindow.loadURL(url);
  mainWindow.show();
  await logBuildInfo(port);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    registerUpdateHandlers();
    try {
      await createWindow();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start application";
      appendLog(`Startup error: ${message}`);
      dialog.showErrorBox(
        "MenschDocs",
        `${message}\n\nCheck logs in:\n${getLogDir()}`
      );
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (!quittingForUpdate) {
      killPythonProcess();
    }
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    if (!quittingForUpdate) {
      killPythonProcess();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
}
