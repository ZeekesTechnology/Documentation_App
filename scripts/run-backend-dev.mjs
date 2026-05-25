import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dataDirEnv } from "./data-dir.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const backendDir = path.join(projectRoot, "backend");

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

const python = findPython();
const env = {
  ...process.env,
  ...dataDirEnv(),
  DOCAPP_PORT: process.env.DOCAPP_PORT ?? "5000",
  DOCAPP_MODE: "development",
  PYTHONUNBUFFERED: "1",
};

const child = spawn(python, ["run_server.py"], {
  cwd: backendDir,
  env,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 0));
