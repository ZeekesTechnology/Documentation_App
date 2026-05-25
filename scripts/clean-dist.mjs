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

function removePath(target, relativePath) {
  if (!fs.existsSync(target)) {
    return;
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      fs.rmSync(target, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 200,
      });
      console.log(`Removed ${relativePath}`);
      return;
    } catch (error) {
      const isBusy =
        error instanceof Error &&
        "code" in error &&
        (error.code === "EBUSY" || error.code === "EPERM");

      if (!isBusy || attempt === 5) {
        console.warn(
          `Could not remove ${relativePath}: ${error instanceof Error ? error.message : error}`
        );
        return;
      }

      console.warn(`Retrying removal of ${relativePath} (${attempt}/5)...`);
    }
  }
}

for (const relativePath of pathsToRemove) {
  removePath(path.join(projectRoot, relativePath), relativePath);
}

console.log("Clean complete.");
