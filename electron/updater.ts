import { app } from "electron";
import fs from "fs";
import https from "https";
import path from "path";
import { spawn } from "child_process";

const GITHUB_OWNER = "ZeekesTechnology";
const GITHUB_REPO = "Documentation_App";
const INSTALLER_PATTERN = /^MenschDocs-.*-Setup\.exe$/i;

export type UpdateCheckResult = {
  status: "available" | "current" | "error" | "unavailable";
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  releaseUrl?: string;
  downloadSize?: number;
  error?: string;
};

export type UpdateDownloadProgress = {
  percent: number;
  transferred: number;
  total: number;
};

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type GitHubRelease = {
  tag_name: string;
  html_url: string;
  body: string;
  assets: GitHubReleaseAsset[];
  draft: boolean;
  prerelease: boolean;
};

type PendingUpdate = {
  version: string;
  downloadUrl: string;
  downloadSize: number;
};

let pendingUpdate: PendingUpdate | null = null;
let downloadInProgress = false;

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function parseVersionParts(version: string): number[] {
  return normalizeVersion(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

export function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = parseVersionParts(latest);
  const currentParts = parseVersionParts(current);
  const length = Math.max(latestParts.length, currentParts.length);

  for (let index = 0; index < length; index += 1) {
    const latestPart = latestParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

function httpsGetJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "MenschDocs-Updater",
        },
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          void httpsGetJson<T>(response.headers.location).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(
            new Error(`GitHub request failed with status ${response.statusCode}`)
          );
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as T);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);
    request.setTimeout(30_000, () => {
      request.destroy(new Error("GitHub request timed out"));
    });
  });
}

function findInstallerAsset(release: GitHubRelease): GitHubReleaseAsset | undefined {
  return release.assets.find((asset) => INSTALLER_PATTERN.test(asset.name));
}

export function getCurrentVersion(): string {
  return app.getVersion();
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  pendingUpdate = null;

  if (!app.isPackaged) {
    return {
      status: "unavailable",
      currentVersion: getCurrentVersion(),
      error: "Updates are only available in the installed desktop app.",
    };
  }

  try {
    const release = await httpsGetJson<GitHubRelease>(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    );

    if (release.draft) {
      return {
        status: "error",
        currentVersion: getCurrentVersion(),
        error: "Latest GitHub release is still a draft.",
      };
    }

    const latestVersion = normalizeVersion(release.tag_name);
    const currentVersion = getCurrentVersion();

    if (!isNewerVersion(latestVersion, currentVersion)) {
      return {
        status: "current",
        currentVersion,
        latestVersion,
        releaseUrl: release.html_url,
      };
    }

    const installer = findInstallerAsset(release);
    if (!installer) {
      return {
        status: "error",
        currentVersion,
        latestVersion,
        error: "The latest release does not include a Windows installer.",
      };
    }

    pendingUpdate = {
      version: latestVersion,
      downloadUrl: installer.browser_download_url,
      downloadSize: installer.size,
    };

    return {
      status: "available",
      currentVersion,
      latestVersion,
      releaseNotes: release.body?.trim() || undefined,
      releaseUrl: release.html_url,
      downloadSize: installer.size,
    };
  } catch (error) {
    return {
      status: "error",
      currentVersion: getCurrentVersion(),
      error:
        error instanceof Error
          ? error.message
          : "Unable to check for updates.",
    };
  }
}

function getInstallerPath(version: string): string {
  const fileName = `MenschDocs-${version}-Setup.exe`;
  return path.join(app.getPath("temp"), fileName);
}

function downloadFile(
  url: string,
  destination: string,
  onProgress: (progress: UpdateDownloadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        void downloadFile(response.headers.location, destination, onProgress).then(
          resolve,
          reject
        );
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const total = Number.parseInt(response.headers["content-length"] ?? "0", 10);
      let transferred = 0;

      const fileStream = fs.createWriteStream(destination);
      response.on("data", (chunk: Buffer) => {
        transferred += chunk.length;
        const percent =
          total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : 0;
        onProgress({ percent, transferred, total });
      });

      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close(() => resolve());
      });

      fileStream.on("error", (error) => {
        fs.unlink(destination, () => reject(error));
      });
    });

    request.on("error", reject);
    request.setTimeout(120_000, () => {
      request.destroy(new Error("Download timed out"));
    });
  });
}

export async function downloadPendingUpdate(
  onProgress: (progress: UpdateDownloadProgress) => void
): Promise<string> {
  if (downloadInProgress) {
    throw new Error("An update download is already in progress.");
  }

  if (!pendingUpdate) {
    throw new Error("No update is available to download.");
  }

  downloadInProgress = true;
  const destination = getInstallerPath(pendingUpdate.version);

  try {
    if (fs.existsSync(destination)) {
      fs.unlinkSync(destination);
    }

    await downloadFile(pendingUpdate.downloadUrl, destination, onProgress);
    onProgress({
      percent: 100,
      transferred: pendingUpdate.downloadSize,
      total: pendingUpdate.downloadSize,
    });
    return destination;
  } finally {
    downloadInProgress = false;
  }
}

export function runInstallerAndQuit(installerPath: string): void {
  if (!fs.existsSync(installerPath)) {
    throw new Error("Installer file was not found.");
  }

  const installDir = path.dirname(app.getPath("exe"));
  const args = ["/S"];

  if (process.platform === "win32" && installDir) {
    args.push(`/D=${installDir}`);
  }

  appendUpdateLog(`Launching installer: ${installerPath} ${args.join(" ")}`);

  const child = spawn(installerPath, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();
  app.exit(0);
}

function appendUpdateLog(message: string): void {
  try {
    const logDir = path.join(app.getPath("userData"), "logs");
    fs.mkdirSync(logDir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(path.join(logDir, "update.log"), line, "utf8");
  } catch {
    /* ignore logging failures */
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
