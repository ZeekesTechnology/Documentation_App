import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
);

const staticJsDir = path.join(
  projectRoot,
  "release",
  "win-unpacked",
  "resources",
  "python",
  "_internal",
  "static",
  "assets"
);
const preloadAsarPath = path.join(
  projectRoot,
  "release",
  "win-unpacked",
  "resources",
  "app.asar"
);

const requiredUiStrings = [
  "Search for Update",
  "Check for Updates",
  "documentationApp",
];

function readBundleFromDir(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Packaged static assets missing at ${dir}`);
  }

  const jsFile = fs
    .readdirSync(dir)
    .find((name) => name.startsWith("index-") && name.endsWith(".js"));

  if (!jsFile) {
    throw new Error("Packaged frontend JS bundle not found.");
  }

  return {
    jsFile,
    source: fs.readFileSync(path.join(dir, jsFile), "utf8"),
  };
}

try {
  const buildInfoPath = path.join(
    projectRoot,
    "backend",
    "static",
    "build-info.json"
  );
  if (!fs.existsSync(buildInfoPath)) {
    throw new Error("build-info.json missing from backend/static.");
  }

  const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));
  if (buildInfo.version !== packageJson.version) {
    throw new Error(
      `build-info version ${buildInfo.version} does not match package.json ${packageJson.version}.`
    );
  }

  const { jsFile, source } = readBundleFromDir(staticJsDir);
  if (buildInfo.bundle !== jsFile) {
    throw new Error(
      `Packaged bundle ${jsFile} does not match build-info ${buildInfo.bundle}.`
    );
  }

  for (const text of requiredUiStrings) {
    if (!source.includes(text)) {
      throw new Error(`Packaged UI bundle is missing "${text}".`);
    }
  }

  if (!fs.existsSync(preloadAsarPath)) {
    throw new Error("Packaged app.asar missing.");
  }

  console.log(
    `Packaged build verification passed (${packageJson.version}, ${jsFile}).`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
