# Documentation App

Windows desktop application built with **Electron**, a **Vite + React** UI, and a local **Flask** backend. The release installer bundles Python via PyInstaller so end users do not need Python installed.

## Prerequisites (development only)

- **Node.js** 20+
- **Python** 3.11+ (for local backend and building the bundle)
- **npm**

## Quick start

### 1. Install Node dependencies

```bash
npm install
npm run build:electron-ts
```

### 2. Create a Python virtual environment

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

On macOS/Linux:

```bash
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Run in development

```bash
npm run dev
```

This starts:

- Flask on `http://127.0.0.1:5000`
- Vite dev server on `http://localhost:5173`
- Electron window loading the Vite UI (API proxied to Flask)

## Project structure

```
documentation-app/
├── electron/          # Main process (spawn/kill Python, window)
├── frontend/          # Vite + React renderer
├── backend/           # Flask API + PyInstaller spec
├── scripts/           # Build and dev helpers
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev: Flask + Vite + Electron |
| `npm run dev:backend` | Flask only |
| `npm run dev:frontend` | Vite only |
| `npm run build` | Build UI + compile Electron TS |
| `npm run build:python` | PyInstaller bundle → `build/python/` |
| `npm run dist` | Full Windows installer (NSIS `.exe`) |

## Production build (Windows installer)

```bash
npm install
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt

npm run dist
```

Output: `release/Documentation App Setup 1.0.0.exe`

The installer includes:

- Electron shell
- PyInstaller-bundled Python + Flask + UI static files

## API

- `GET /api/health` — backend health check
- `GET /api/projects` — sample project list (extend as needed)

In production, Flask also serves the built React app from `backend/static`.

## Data storage (S: drive)

By default, all app data is stored on your **internal SSD (S:)** at:

```
S:\Documentation App\Data\
├── logs\         # app.log
├── projects\     # documentation (future)
├── attachments\  # files (future)
└── db\           # local database (future)
```

The backend creates these folders on startup. The dashboard shows the active path when the backend is online.

### Override locations

| Variable | Purpose |
|----------|---------|
| `DOCAPP_DATA_DIR` | Full path to data root (highest priority) |
| `DOCAPP_S_DRIVE_ROOT` | Change default S: path (default: `S:\Documentation App\Data`) |
| `DOCAPP_DATA_FALLBACK` | Used when S: is not available |

Example (PowerShell):

```powershell
$env:DOCAPP_DATA_DIR = "S:\MyDocs\DocumentationApp"
npm run dev
```

If S: is unavailable, dev falls back to `./data` in the project folder; the installed app falls back to `%APPDATA%/Documentation App/data`.

## Logs

Logs are written under the data directory: `{dataDir}/logs/app.log`

## Security

- Flask binds to **127.0.0.1** only
- Renderer: `contextIsolation`, no `nodeIntegration`
- Single-instance lock prevents duplicate backends

## Extending

1. Add Flask routes in `backend/app.py`
2. Add UI in `frontend/src/`
3. Rebuild with `npm run dist` for a new installer

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend timeout on `npm run dev` | Ensure venv is active and `pip install -r backend/requirements.txt` |
| PyInstaller fails | Run from project root; use `.venv` Python |
| Blank window in production | Run `npm run build:frontend` before `build:python` (included in `npm run dist`) |
| `electron-builder` symlink / winCodeSign errors | Run as Administrator, or use `signAndEditExecutable: false` (already set in `package.json`) |

## Notes

- Installer output: `release/Documentation App Setup 1.0.0.exe`
- Unpacked app for testing: `release/win-unpacked/Documentation App.exe`
- Code signing is disabled for local builds; use a certificate for production distribution
