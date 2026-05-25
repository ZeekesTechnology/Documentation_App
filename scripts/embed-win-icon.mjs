import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const rcedit = require("rcedit");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const packagedRoot = path.resolve(
  projectRoot,
  process.env.PACKAGED_ROOT ?? "release"
);
const exePath = path.join(packagedRoot, "win-unpacked", "MenschDocs.exe");
const iconPath = path.join(projectRoot, "build", "icon.ico");

function verifyFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} missing at ${filePath}`);
  }
}

async function main() {
  verifyFile(iconPath, "App icon");
  verifyFile(exePath, "Packaged MenschDocs.exe");

  await rcedit(exePath, {
    icon: iconPath,
    "version-string": {
      ProductName: "MenschDocs",
      FileDescription: "MenschDocs",
      CompanyName: "MenschDocs",
    },
  });

  console.log(`Embedded custom icon into ${exePath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
