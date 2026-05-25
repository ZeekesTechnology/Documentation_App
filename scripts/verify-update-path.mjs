/**
 * Verifies the GitHub release update path used by electron/updater.ts.
 * Run after publishing a release: node scripts/verify-update-path.mjs [installedVersion]
 */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const GITHUB_OWNER = "ZeekesTechnology";
const GITHUB_REPO = "Documentation_App";
const INSTALLER_PATTERN = /^MenschDocs-.*-Setup\.exe$/i;

const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
);

const installedVersion = process.argv[2] ?? "1.0.3";
const expectedLatest = packageJson.version;

function normalizeVersion(version) {
  return version.trim().replace(/^v/i, "");
}

function parseVersionParts(version) {
  return normalizeVersion(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function isNewerVersion(latest, current) {
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

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "MenschDocs-UpdateVerify",
        },
      },
      (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          void httpsGetJson(response.headers.location).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(
            new Error(`GitHub request failed with status ${response.statusCode}`)
          );
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
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

function headRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      { method: "HEAD", headers: { "User-Agent": "MenschDocs-UpdateVerify" } },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      }
    );
    request.on("error", reject);
    request.setTimeout(30_000, () => {
      request.destroy(new Error("Download HEAD timed out"));
    });
    request.end();
  });
}

async function main() {
  console.log(`Simulating installed version: ${installedVersion}`);
  console.log(`Expecting latest release:     ${expectedLatest}`);

  if (!isNewerVersion(expectedLatest, installedVersion)) {
    throw new Error(
      `Version logic: ${expectedLatest} is not newer than ${installedVersion}.`
    );
  }
  console.log("Version comparison: update would be offered.");

  const release = await httpsGetJson(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
  );

  if (release.draft) {
    throw new Error("Latest GitHub release is still a draft.");
  }

  const latestVersion = normalizeVersion(release.tag_name);
  if (latestVersion !== normalizeVersion(expectedLatest)) {
    throw new Error(
      `Latest GitHub release is ${latestVersion}, expected ${expectedLatest}.`
    );
  }
  console.log(`GitHub latest release: v${latestVersion}`);

  const installer = release.assets?.find((asset) =>
    INSTALLER_PATTERN.test(asset.name)
  );
  if (!installer) {
    throw new Error("Latest release has no MenschDocs-*-Setup.exe asset.");
  }
  console.log(`Installer asset: ${installer.name} (${installer.size} bytes)`);

  const status = await headRequest(installer.browser_download_url);
  if (status !== 200 && status !== 302) {
    throw new Error(`Installer download URL returned HTTP ${status}.`);
  }
  console.log(`Installer download URL reachable (HTTP ${status}).`);

  if (!isNewerVersion(latestVersion, installedVersion)) {
    throw new Error(
      `Installed ${installedVersion} would not see an update for ${latestVersion}.`
    );
  }

  console.log(
    `End-to-end update path verified: ${installedVersion} -> ${latestVersion}.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
