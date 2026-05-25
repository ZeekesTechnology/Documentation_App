"""Resolve and prepare on-disk data directories."""
import os
from pathlib import Path

# Default: internal SSD (S:). Override with DOCAPP_DATA_DIR.
DEFAULT_S_DRIVE_DATA = r"S:\Documentation App\Data"

SUBDIRS = ("logs", "projects", "attachments", "db")


def resolve_data_dir() -> Path:
    explicit = os.environ.get("DOCAPP_DATA_DIR")
    if explicit:
        return Path(explicit).resolve()

    s_drive = Path(os.environ.get("DOCAPP_S_DRIVE_ROOT", DEFAULT_S_DRIVE_DATA))
    if _drive_available(s_drive):
        return s_drive.resolve()

    # Fallback when S: is missing (other machines, CI)
    fallback = os.environ.get("DOCAPP_DATA_FALLBACK")
    if fallback:
        return Path(fallback).resolve()

    local = Path(__file__).resolve().parent.parent / "data"
    return local.resolve()


def _drive_available(target: Path) -> bool:
    drive = target.drive or (str(target)[:2] if len(str(target)) >= 2 else "")
    if not drive:
        return target.parent.exists()
    root = Path(f"{drive}\\")
    return root.exists()


def ensure_data_dirs() -> Path:
    root = resolve_data_dir()
    root.mkdir(parents=True, exist_ok=True)
    for name in SUBDIRS:
        (root / name).mkdir(parents=True, exist_ok=True)
    return root
