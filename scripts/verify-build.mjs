import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const staticJsDir = path.join(projectRoot, "backend", "static", "assets");
const preloadPath = path.join(projectRoot, "electron", "dist", "preload.js");
const updaterPath = path.join(projectRoot, "electron", "dist", "updater.js");
const iconPath = path.join(projectRoot, "build", "icon.ico");
const logoSource = path.join(
  projectRoot,
  "Org Logos",
  "MenschDocs 48x48 Logo.png"
);

const requiredUiStrings = [
  "Search for Update",
  "Check for Updates",
  "documentationApp",
];

function readStaticBundle() {
  if (!fs.existsSync(staticJsDir)) {
    throw new Error("backend/static/assets missing. Run build:frontend first.");
  }

  const jsFile = fs
    .readdirSync(staticJsDir)
    .find((name) => name.startsWith("index-") && name.endsWith(".js"));

  if (!jsFile) {
    throw new Error("Built frontend JS bundle not found in backend/static/assets.");
  }

  return fs.readFileSync(path.join(staticJsDir, jsFile), "utf8");
}

function verifyFile(pathname, label) {
  if (!fs.existsSync(pathname)) {
    throw new Error(`${label} missing at ${pathname}`);
  }
}

try {
  verifyFile(iconPath, "App icon");
  verifyFile(logoSource, "Logo source");
  verifyFile(preloadPath, "Electron preload");
  verifyFile(updaterPath, "Electron updater");

  const preloadSource = fs.readFileSync(preloadPath, "utf8");
  if (!preloadSource.includes("checkForUpdates")) {
    throw new Error("Electron preload is missing update IPC bindings.");
  }

  const updaterSource = fs.readFileSync(updaterPath, "utf8");
  if (!updaterSource.includes("ZeekesTechnology")) {
    throw new Error("Electron updater module was not built correctly.");
  }

  const bundle = readStaticBundle();
  for (const text of requiredUiStrings) {
    if (!bundle.includes(text)) {
      throw new Error(`Frontend bundle is missing "${text}".`);
    }
  }

  const buildInfoPath = path.join(projectRoot, "backend", "static", "build-info.json");
  verifyFile(buildInfoPath, "Build info manifest");

  const pythonStaticDir = path.join(
    projectRoot,
    "build",
    "python",
    "_internal",
    "static",
    "assets"
  );
  if (!fs.existsSync(pythonStaticDir)) {
    throw new Error("PyInstaller static assets missing in build/python.");
  }

  const pythonJsFile = fs
    .readdirSync(pythonStaticDir)
    .find((name) => name.startsWith("index-") && name.endsWith(".js"));

  if (!pythonJsFile) {
    throw new Error("PyInstaller JS bundle not found.");
  }

  const pythonBundle = fs.readFileSync(
    path.join(pythonStaticDir, pythonJsFile),
    "utf8"
  );

  for (const text of requiredUiStrings) {
    if (!pythonBundle.includes(text)) {
      throw new Error(`PyInstaller bundle is missing "${text}".`);
    }
  }

  console.log("Build verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
