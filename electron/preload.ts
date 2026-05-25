import { contextBridge, ipcRenderer } from "electron";

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

contextBridge.exposeInMainWorld("documentationApp", {
  platform: process.platform,
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("update:get-version"),
  isPackaged: (): Promise<boolean> => ipcRenderer.invoke("update:is-packaged"),
  checkForUpdates: (): Promise<UpdateCheckResult> =>
    ipcRenderer.invoke("update:check"),
  downloadAndInstallUpdate: (): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke("update:download-and-install"),
  onUpdateDownloadProgress: (
    callback: (progress: UpdateDownloadProgress) => void
  ): (() => void) => {
    const listener = (_event: unknown, progress: UpdateDownloadProgress) => {
      callback(progress);
    };
    ipcRenderer.on("update:download-progress", listener);
    return () => {
      ipcRenderer.removeListener("update:download-progress", listener);
    };
  },
  onOpenUpdateDialog: (callback: () => void): (() => void) => {
    const listener = () => {
      callback();
    };
    ipcRenderer.on("help:open-update", listener);
    return () => {
      ipcRenderer.removeListener("help:open-update", listener);
    };
  },
});
