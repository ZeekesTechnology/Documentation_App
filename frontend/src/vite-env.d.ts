/// <reference types="vite/client" />

type UpdateCheckResult = {
  status: "available" | "current" | "error" | "unavailable";
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  releaseUrl?: string;
  downloadSize?: number;
  error?: string;
};

type UpdateDownloadProgress = {
  percent: number;
  transferred: number;
  total: number;
};

interface DocumentationAppApi {
  platform: string;
  getAppVersion: () => Promise<string>;
  isPackaged: () => Promise<boolean>;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  downloadAndInstallUpdate: () => Promise<{ ok: boolean; error?: string }>;
  onUpdateDownloadProgress: (
    callback: (progress: UpdateDownloadProgress) => void
  ) => () => void;
}

declare global {
  interface Window {
    documentationApp?: DocumentationAppApi;
  }
}

export {};
