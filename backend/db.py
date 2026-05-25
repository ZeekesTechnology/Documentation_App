"""SQLite persistence for MenschDocs."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from data_paths import ensure_data_dirs, resolve_data_dir

SCHEMA = """
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    org_type TEXT NOT NULL DEFAULT 'Customer',
    status TEXT NOT NULL DEFAULT 'Active',
    favorite INTEGER NOT NULL DEFAULT 0,
    sync_status TEXT NOT NULL DEFAULT 'Not Synced',
    myglue_account TEXT NOT NULL DEFAULT 'Disabled',
    description TEXT NOT NULL DEFAULT '',
    quick_notes TEXT NOT NULL DEFAULT '{}',
    logo_initials TEXT NOT NULL DEFAULT '',
    last_viewed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_org_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_org_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_org_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_org_favorite ON organizations(favorite);
CREATE INDEX IF NOT EXISTS idx_org_last_viewed ON organizations(last_viewed_at);

CREATE TABLE IF NOT EXISTS organization_assets (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assets_org_type ON organization_assets(org_id, asset_type);
"""

EXTRA_COLUMNS = [
    ("short_name", "TEXT NOT NULL DEFAULT ''"),
    ("alert_message", "TEXT NOT NULL DEFAULT ''"),
    ("parent_org_id", "TEXT"),
    ("location_name", "TEXT NOT NULL DEFAULT ''"),
    ("address", "TEXT NOT NULL DEFAULT ''"),
    ("city", "TEXT NOT NULL DEFAULT ''"),
    ("country", "TEXT NOT NULL DEFAULT ''"),
    ("state_province", "TEXT NOT NULL DEFAULT ''"),
    ("zip_code", "TEXT NOT NULL DEFAULT ''"),
    ("logo_path", "TEXT NOT NULL DEFAULT ''"),
]


def _migrate_schema(conn: sqlite3.Connection) -> None:
    existing = {
        row[1] for row in conn.execute("PRAGMA table_info(organizations)").fetchall()
    }
    for name, col_type in EXTRA_COLUMNS:
        if name not in existing:
            conn.execute(f"ALTER TABLE organizations ADD COLUMN {name} {col_type}")


def get_db_path() -> Path:
    return resolve_data_dir() / "db" / "docvault.db"


def init_db() -> None:
    ensure_data_dirs()
    db_path = get_db_path()
    with sqlite3.connect(db_path) as conn:
        conn.executescript(SCHEMA)
        _migrate_schema(conn)
        conn.commit()


@contextmanager
def get_connection():
    init_db()
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
