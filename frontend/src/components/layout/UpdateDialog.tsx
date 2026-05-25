import { Download, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes } from "../../lib/formatBytes";

type UpdatePhase =
  | "checking"
  | "available"
  | "current"
  | "downloading"
  | "installing"
  | "error"
  | "unavailable";

type UpdateDialogProps = {
  open: boolean;
  onClose: () => void;
};

function getDocumentationApp() {
  return window.documentationApp;
}

export function UpdateDialog({ open, onClose }: UpdateDialogProps) {
  const [phase, setPhase] = useState<UpdatePhase>("checking");
  const [currentVersion, setCurrentVersion] = useState("—");
  const [latestVersion, setLatestVersion] = useState<string | undefined>();
  const [releaseNotes, setReleaseNotes] = useState<string | undefined>();
  const [downloadSize, setDownloadSize] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [progress, setProgress] = useState(0);
  const [transferred, setTransferred] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!open) return;

    setPhase("checking");
    setError(undefined);
    setProgress(0);
    setTransferred(0);
    setTotal(0);

    const api = getDocumentationApp();
    if (!api) {
      setPhase("unavailable");
      setError("Updates are only available in the desktop application.");
      return;
    }

    void api.getAppVersion().then(setCurrentVersion);

    void api.checkForUpdates().then((result) => {
      setCurrentVersion(result.currentVersion);
      setLatestVersion(result.latestVersion);
      setReleaseNotes(result.releaseNotes);
      setDownloadSize(result.downloadSize);

      if (result.status === "available") {
        setPhase("available");
        return;
      }

      if (result.status === "current") {
        setPhase("current");
        return;
      }

      if (result.status === "unavailable") {
        setPhase("unavailable");
        setError(result.error);
        return;
      }

      setPhase("error");
      setError(result.error ?? "Unable to check for updates.");
    });
  }, [open]);

  useEffect(() => {
    if (phase !== "downloading") return;

    const api = getDocumentationApp();
    if (!api) return;

    const unsubscribe = api.onUpdateDownloadProgress((next) => {
      setProgress(next.percent);
      setTransferred(next.transferred);
      setTotal(next.total);
    });

    void api.downloadAndInstallUpdate().then((result) => {
      if (!result.ok) {
        setPhase("error");
        setError(result.error ?? "Update failed.");
        return;
      }

      setPhase("installing");
      setProgress(100);
    });

    return unsubscribe;
  }, [phase]);

  if (!open) return null;

  const canClose = phase !== "downloading" && phase !== "installing";

  const handleUpdate = () => {
    setPhase("downloading");
    setProgress(0);
    setTransferred(0);
    setTotal(downloadSize ?? 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-lg rounded-lg border border-vault-border bg-vault-panel shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
      >
        <div className="flex items-start justify-between border-b border-vault-border px-5 py-4">
          <div>
            <h2
              id="update-dialog-title"
              className="text-lg font-semibold text-white"
            >
              Check for Updates
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Current version: {currentVersion}
            </p>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="space-y-4 px-5 py-5">
          {phase === "checking" && (
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin text-vault-green" />
              Searching GitHub for the latest release…
            </div>
          )}

          {phase === "current" && (
            <div className="rounded border border-vault-border bg-vault-bg px-4 py-3 text-sm text-gray-300">
              You&apos;re up to date. MenschDocs {currentVersion} is the latest
              release.
            </div>
          )}

          {phase === "available" && (
            <>
              <div className="rounded border border-vault-green/30 bg-vault-green/10 px-4 py-3">
                <p className="text-sm font-medium text-white">
                  Version {latestVersion} is available
                </p>
                {downloadSize ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Download size: {formatBytes(downloadSize)}
                  </p>
                ) : null}
              </div>
              {releaseNotes ? (
                <div className="max-h-40 overflow-y-auto rounded border border-vault-border bg-vault-bg px-4 py-3 text-sm text-gray-300 whitespace-pre-wrap">
                  {releaseNotes}
                </div>
              ) : null}
            </>
          )}

          {(phase === "downloading" || phase === "installing") && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                {phase === "installing" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-vault-green" />
                    Installing update and restarting MenschDocs…
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 text-vault-green" />
                    Downloading version {latestVersion}…
                  </>
                )}
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-vault-bg">
                <div
                  className="h-full rounded-full bg-vault-green transition-[width] duration-200"
                  style={{ width: `${Math.max(progress, phase === "installing" ? 100 : 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{progress}%</span>
                <span>
                  {formatBytes(transferred)}
                  {total > 0 ? ` / ${formatBytes(total)}` : ""}
                </span>
              </div>
            </div>
          )}

          {(phase === "error" || phase === "unavailable") && (
            <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error ?? "Updates are unavailable in this environment."}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-vault-border px-5 py-4">
          {phase === "available" && (
            <button type="button" className="btn-primary" onClick={handleUpdate}>
              <RefreshCw className="h-4 w-4" />
              Download and Install Update
            </button>
          )}
          {canClose && (
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
