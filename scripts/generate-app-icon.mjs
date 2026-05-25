import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function findPython() {
  const candidates = [
    path.join(projectRoot, ".venv", "Scripts", "python.exe"),
    path.join(projectRoot, ".venv", "bin", "python"),
    process.platform === "win32" ? "python" : "python3",
  ];
  for (const cmd of candidates) {
    if (cmd.includes(path.sep) && fs.existsSync(cmd)) return cmd;
    if (!cmd.includes(path.sep)) return cmd;
  }
  return "python";
}

const result = spawnSync(
  findPython(),
  [path.join(__dirname, "generate-app-icon.py")],
  { stdio: "inherit", shell: false }
);

process.exit(result.status ?? 1);
