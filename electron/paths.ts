import fs from "fs";
import path from "path";
import { app } from "electron";

/** Default data root on internal SSD (S:). Override with DOCAPP_DATA_DIR. */
export const DEFAULT_S_DRIVE_DATA = "S:\\Documentation App\\Data";

export interface PythonLaunchConfig {
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
}

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function findVenvPython(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, ".venv", "Scripts", "python.exe"),
    path.join(projectRoot, ".venv", "bin", "python"),
    path.join(projectRoot, "venv", "Scripts", "python.exe"),
    path.join(projectRoot, "venv", "bin", "python"),
  ];
  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function findBundledPython(): string | null {
  const resourcesPath = process.resourcesPath;
  const candidates = [
    path.join(resourcesPath, "python", "documentation-app", "documentation-app.exe"),
    path.join(resourcesPath, "python", "documentation-app.exe"),
    path.join(resourcesPath, "python", "python.exe"),
  ];
  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function getProjectRoot(): string {
  if (app.isPackaged) {
    return path.dirname(app.getPath("exe"));
  }
  return path.resolve(__dirname, "..", "..");
}

function driveRootExists(driveLetter: string): boolean {
  if (!driveLetter) return false;
  const root = `${driveLetter}\\`;
  try {
    fs.accessSync(root, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function getDataDir(): string {
  if (process.env.DOCAPP_DATA_DIR) {
    return path.resolve(process.env.DOCAPP_DATA_DIR);
  }

  const sDrivePath = process.env.DOCAPP_S_DRIVE_ROOT ?? DEFAULT_S_DRIVE_DATA;
  const drive = sDrivePath.slice(0, 2);
  if (driveRootExists(drive)) {
    return path.resolve(sDrivePath);
  }

  if (process.env.DOCAPP_DATA_FALLBACK) {
    return path.resolve(process.env.DOCAPP_DATA_FALLBACK);
  }

  if (app.isPackaged) {
    return path.join(app.getPath("userData"), "data");
  }

  return path.resolve(getProjectRoot(), "data");
}

export function getPythonLaunchConfig(port: number): PythonLaunchConfig {
  const projectRoot = getProjectRoot();
  const dataDir = getDataDir();
  const env: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]
    ),
    DOCAPP_PORT: String(port),
    DOCAPP_DATA_DIR: dataDir,
    PYTHONUNBUFFERED: "1",
  };

  if (app.isPackaged) {
    const bundled = findBundledPython();
    if (!bundled) {
      throw new Error(
        "Bundled Python runtime not found. Rebuild with: npm run build:python"
      );
    }
    env.DOCAPP_MODE = "production";
    return {
      command: bundled,
      args: [],
      cwd: path.dirname(bundled),
      env,
    };
  }

  env.DOCAPP_MODE = "development";
  const venvPython = findVenvPython(projectRoot);
  const command = venvPython ?? (process.platform === "win32" ? "python" : "python3");
  const runServer = path.join(projectRoot, "backend", "run_server.py");

  return {
    command,
    args: [runServer],
    cwd: path.join(projectRoot, "backend"),
    env,
  };
}

export function getRendererUrl(port: number): string {
  if (!app.isPackaged && process.env.NODE_ENV === "development") {
    return "http://localhost:5173";
  }
  return `http://127.0.0.1:${port}`;
}

export function getLogDir(): string {
  return path.join(getDataDir(), "logs");
}
