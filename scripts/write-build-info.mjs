import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
);
const staticAssetsDir = path.join(projectRoot, "backend", "static", "assets");

function findBundleFile() {
  if (!fs.existsSync(staticAssetsDir)) {
    throw new Error("backend/static/assets missing. Run build:frontend first.");
  }

  const jsFile = fs
    .readdirSync(staticAssetsDir)
    .find((name) => name.startsWith("index-") && name.endsWith(".js"));

  if (!jsFile) {
    throw new Error("Frontend JS bundle not found in backend/static/assets.");
  }

  return jsFile;
}

const jsFile = findBundleFile();
const buildInfo = {
  version: packageJson.version,
  bundle: jsFile,
  builtAt: new Date().toISOString(),
  features: ["help-update", "custom-icon"],
};

const targets = [
  path.join(projectRoot, "backend", "static", "build-info.json"),
  path.join(projectRoot, "frontend", "dist", "build-info.json"),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");
}

console.log(`Wrote build-info.json (${buildInfo.version}, ${buildInfo.bundle})`);
