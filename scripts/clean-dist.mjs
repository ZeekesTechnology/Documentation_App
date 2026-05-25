import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const pathsToRemove = [
  "frontend/dist",
  "backend/static",
  "build/python",
  "backend/dist",
  "backend/build",
  "release/win-unpacked",
];

for (const relativePath of pathsToRemove) {
  const target = path.join(projectRoot, relativePath);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${relativePath}`);
  }
}

console.log("Clean complete.");
