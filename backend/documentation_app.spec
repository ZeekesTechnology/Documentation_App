# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec — run from backend/ via scripts/build-python.mjs"""
import os
from pathlib import Path

block_cipher = None
backend_dir = Path(SPECPATH).resolve()
static_dir = backend_dir / "static"
datas = []
if static_dir.is_dir():
    datas.append((str(static_dir), "static"))

a = Analysis(
    ["run_server.py"],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=["waitress", "flask", "werkzeug", "jinja2", "data_paths", "db", "organizations", "dashboard", "seed"],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="documentation-app",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="documentation-app",
)
