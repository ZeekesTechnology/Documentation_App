import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const backendDir = path.join(projectRoot, "backend");
const staticDir = path.join(backendDir, "static");
const outDir = path.join(projectRoot, "build", "python");

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

if (!fs.existsSync(staticDir)) {
  console.error(
    "backend/static missing. Run: npm run build:frontend (copies UI into backend/static)"
  );
  process.exit(1);
}

const python = findPython();
console.log(`Building Python bundle with ${python}...`);

const pyinstaller = spawnSync(
  python,
  ["-m", "PyInstaller", "--noconfirm", "--clean", "documentation_app.spec"],
  { cwd: backendDir, stdio: "inherit", shell: false }
);

if (pyinstaller.status !== 0) {
  process.exit(pyinstaller.status ?? 1);
}

const distFolder = path.join(backendDir, "dist", "documentation-app");
if (!fs.existsSync(distFolder)) {
  console.error(`Expected PyInstaller output at ${distFolder}`);
  process.exit(1);
}

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}

fs.mkdirSync(path.dirname(outDir), { recursive: true });
fs.cpSync(distFolder, outDir, { recursive: true });

console.log(`Python bundle ready at ${outDir}`);
