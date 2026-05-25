import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/** Default data root on internal SSD (S:). Override with DOCAPP_DATA_DIR. */
export const DEFAULT_S_DRIVE_DATA = "S:\\Documentation App\\Data";

export function resolveDataDir() {
  if (process.env.DOCAPP_DATA_DIR) {
    return path.resolve(process.env.DOCAPP_DATA_DIR);
  }

  const sDrivePath =
    process.env.DOCAPP_S_DRIVE_ROOT ?? DEFAULT_S_DRIVE_DATA;
  const drive = sDrivePath.slice(0, 2);
  try {
    if (fs.existsSync(`${drive}\\`)) {
      return path.resolve(sDrivePath);
    }
  } catch {
    // fall through
  }

  if (process.env.DOCAPP_DATA_FALLBACK) {
    return path.resolve(process.env.DOCAPP_DATA_FALLBACK);
  }

  return path.join(projectRoot, "data");
}

export function dataDirEnv() {
  return { DOCAPP_DATA_DIR: resolveDataDir() };
}
