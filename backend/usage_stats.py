"""Compute and persist global system usage metrics for the dashboard."""
from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime, timedelta, timezone

USAGE_METRIC_KEYS = (
    "assets",
    "configurations",
    "contacts",
    "documents",
    "domains",
    "locations",
    "organizations",
    "passwords",
    "related_items",
    "certificates",
    "users",
)

USAGE_LABELS = {
    "assets": "Assets",
    "configurations": "Configurations",
    "contacts": "Contacts",
    "documents": "Documents",
    "domains": "Domains",
    "locations": "Locations",
    "organizations": "Organizations",
    "passwords": "Passwords",
    "related_items": "Related Items",
    "certificates": "Certificates",
    "users": "Users",
}

USAGE_SCHEMA = """
CREATE TABLE IF NOT EXISTS usage_snapshots (
    snapshot_date TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (snapshot_date, metric_key)
);
"""


def ensure_usage_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(USAGE_SCHEMA)


def _count_asset_type(conn: sqlite3.Connection, asset_type: str) -> int:
    row = conn.execute(
        """
        SELECT COUNT(*) AS n
        FROM organization_assets
        WHERE asset_type = ?
        """,
        (asset_type,),
    ).fetchone()
    return int(row["n"] if row else 0)


def _count_storage_items(
    conn: sqlite3.Connection,
    storage_key: str,
    predicate,
) -> int:
    total = 0
    rows = conn.execute(
        "SELECT payload FROM org_local_storage WHERE storage_key = ?",
        (storage_key,),
    ).fetchall()
    for row in rows:
        try:
            items = json.loads(row["payload"])
        except json.JSONDecodeError:
            continue
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, dict) and predicate(item):
                total += 1
    return total


def compute_current_usage(conn: sqlite3.Connection) -> dict[str, int]:
    configurations = _count_asset_type(conn, "configurations")
    contacts = _count_asset_type(conn, "contacts")
    domains = _count_asset_type(conn, "domain_tracker")
    locations = _count_asset_type(conn, "locations")
    certificates = _count_asset_type(conn, "ssl_tracker")
    checklists = _count_asset_type(conn, "checklists")
    licenses = _count_asset_type(conn, "licenses")
    wireless_assets = _count_asset_type(conn, "wireless")

    documents = _count_storage_items(
        conn,
        "documents",
        lambda item: item.get("kind") == "document",
    )
    passwords = _count_storage_items(
        conn,
        "passwords",
        lambda item: item.get("kind") == "password",
    )
    wireless_networks = _count_storage_items(
        conn,
        "wireless",
        lambda item: not item.get("archived"),
    )

    organizations = int(
        conn.execute("SELECT COUNT(*) FROM organizations").fetchone()[0]
    )

    assets = (
        configurations
        + contacts
        + domains
        + locations
        + certificates
        + checklists
        + licenses
        + wireless_assets
        + wireless_networks
        + documents
        + passwords
    )
    related_items = checklists + licenses + wireless_networks + wireless_assets

    return {
        "assets": assets,
        "configurations": configurations,
        "contacts": contacts,
        "documents": documents,
        "domains": domains,
        "locations": locations,
        "organizations": organizations,
        "passwords": passwords,
        "related_items": related_items,
        "certificates": certificates,
        "users": 1,
    }


def _upsert_snapshot(
    conn: sqlite3.Connection,
    snapshot_date: str,
    metrics: dict[str, int],
) -> None:
    for key, value in metrics.items():
        conn.execute(
            """
            INSERT INTO usage_snapshots (snapshot_date, metric_key, value)
            VALUES (?, ?, ?)
            ON CONFLICT(snapshot_date, metric_key) DO UPDATE SET value = excluded.value
            """,
            (snapshot_date, key, value),
        )


def _backfill_history(conn: sqlite3.Connection, metrics: dict[str, int], today: date) -> None:
    row = conn.execute("SELECT COUNT(*) FROM usage_snapshots").fetchone()
    if row and row[0]:
        return

    for days_ago in range(59, -1, -1):
        snapshot_date = (today - timedelta(days=days_ago)).isoformat()
        _upsert_snapshot(conn, snapshot_date, metrics)


def _load_history(
    conn: sqlite3.Connection,
    start_date: date,
    end_date: date,
) -> dict[str, dict[str, int]]:
    rows = conn.execute(
        """
        SELECT snapshot_date, metric_key, value
        FROM usage_snapshots
        WHERE snapshot_date BETWEEN ? AND ?
        ORDER BY snapshot_date ASC
        """,
        (start_date.isoformat(), end_date.isoformat()),
    ).fetchall()

    history: dict[str, dict[str, int]] = {}
    for row in rows:
        history.setdefault(row["snapshot_date"], {})[row["metric_key"]] = int(row["value"])
    return history


def build_system_usage(conn: sqlite3.Connection) -> dict:
    ensure_usage_schema(conn)

    now = datetime.now(timezone.utc)
    today = now.date()
    start_date = today - timedelta(days=59)

    metrics = compute_current_usage(conn)
    _backfill_history(conn, metrics, today)
    _upsert_snapshot(conn, today.isoformat(), metrics)

    raw_history = _load_history(conn, start_date, today)
    dates: list[str] = []
    series: dict[str, list[int]] = {key: [] for key in USAGE_METRIC_KEYS}
    last_values = {key: 0 for key in USAGE_METRIC_KEYS}

    current = start_date
    while current <= today:
        date_key = current.isoformat()
        dates.append(current.strftime("%m/%d"))
        day_values = raw_history.get(date_key, {})
        for key in USAGE_METRIC_KEYS:
            if key in day_values:
                last_values[key] = day_values[key]
            series[key].append(last_values[key])
        current += timedelta(days=1)

    return {
        "asOf": now.isoformat(),
        "totals": metrics,
        "history": {
            "dates": dates,
            "series": series,
        },
        "labels": USAGE_LABELS,
    }
