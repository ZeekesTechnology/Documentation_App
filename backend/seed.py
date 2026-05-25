"""Seed demo organizations. Run: python seed.py"""
import json
import uuid
from datetime import datetime, timezone

from assets import ASSET_TYPES
from db import get_connection, init_db

NOW = datetime.now(timezone.utc).isoformat()

SAMPLE_ORGS = [
    ("Ben E. Keith, Co.", "Client", "Active", "Synced", "Enabled", "BE", True),
    ("101st Airborne Association", "Customer", "Active", "Synced", "Enabled", "10", False),
    ("# iStreet Ops #", "Customer", "Active", "Not Synced", "Disabled", "IO", False),
    ("Acme Manufacturing", "Customer", "Active", "Synced", "Enabled", "AM", True),
    ("Blue Ridge Medical", "Client", "Active", "Synced", "Enabled", "BR", False),
    ("Coastal Logistics LLC", "Customer", "Inactive", "Not Synced", "Disabled", "CL", False),
    ("Delta Financial Group", "Client", "Active", "Synced", "Enabled", "DF", False),
    ("Evergreen Properties", "Customer", "Active", "Not Synced", "Disabled", "EP", False),
    ("First National Credit Union", "Client", "Active", "Synced", "Enabled", "FN", True),
    ("Gateway Charter School", "Customer", "Active", "Synced", "Enabled", "GC", False),
    ("Harborview Clinic", "Client", "Active", "Not Synced", "Disabled", "HC", False),
    ("Ironclad Security Inc.", "Customer", "Active", "Synced", "Enabled", "IS", False),
    ("Jetstream Aviation", "Client", "Inactive", "Not Synced", "Disabled", "JA", False),
    ("Keystone Law Partners", "Customer", "Active", "Synced", "Enabled", "KL", False),
    ("Lakeside Hospitality", "Client", "Active", "Synced", "Enabled", "LH", False),
    ("Metro Print & Design", "Customer", "Active", "Not Synced", "Disabled", "MP", False),
    ("Northstar Energy Co-op", "Client", "Active", "Synced", "Enabled", "NE", False),
    ("Oakwood Senior Living", "Customer", "Active", "Synced", "Enabled", "OS", False),
    ("Pacific Rim Trading", "Client", "Active", "Not Synced", "Disabled", "PR", False),
    ("Quantum Research Labs", "Customer", "Active", "Synced", "Enabled", "QR", False),
]

BEN_NOTES = {
    "core_services": "Primary VSA: Kaseya VSA — https://vsa.example.com",
    "p1_info": "P1: Call NOC line. Escalate to on-call engineer.",
    "approvers": "Level 15: Jane Smith\nLevel 99: IT Director",
    "regional": "Account Manager: Alex Rivera\nService Delivery: Morgan Lee",
    "maintenance": "Server IP: 10.0.1.50\nMapped drive: K:\\\nWorkstation standard: Win11 23H2",
    "critical": "O365 SharePoint — primary collaboration\nDomain: benekeith.local",
}


def asset_counts_for_index(index: int) -> dict[str, int]:
    """Per-organization asset counts — each client gets different numbers."""
    if index == 0:
        return {
            "checklists": 0,
            "configurations": 0,
            "contacts": 0,
            "documents": 0,
            "domain_tracker": 0,
            "locations": 0,
            "licenses": 0,
            "passwords": 0,
            "ssl_tracker": 0,
            "wireless": 0,
        }
    n = index + 1
    return {
        "checklists": 0 if n % 4 == 0 else n % 3,
        "configurations": 0,
        "contacts": 0,
        "documents": 0,
        "domain_tracker": 0,
        "locations": 0,
        "licenses": 0 if n % 6 == 0 else min(5, (n % 5) + 1),
        "passwords": 0,
        "ssl_tracker": 0,
        "wireless": 0 if n % 3 == 0 else 1,
    }


def _insert_assets(conn, org_id: str, counts: dict[str, int]) -> None:
    for asset_type in ASSET_TYPES:
        for j in range(counts.get(asset_type, 0)):
            conn.execute(
                """
                INSERT INTO organization_assets (id, org_id, asset_type, title, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    org_id,
                    asset_type,
                    f"{asset_type.replace('_', ' ').title()} {j + 1}",
                    NOW,
                ),
            )


def seed_assets(force: bool = False) -> int:
    init_db()
    with get_connection() as conn:
        count = conn.execute(
            "SELECT COUNT(*) FROM organization_assets"
        ).fetchone()[0]
        if count > 0 and not force:
            return count

        if force:
            conn.execute("DELETE FROM organization_assets")

        orgs = conn.execute(
            "SELECT id FROM organizations ORDER BY created_at ASC"
        ).fetchall()
        for i, org in enumerate(orgs):
            _insert_assets(conn, org["id"], asset_counts_for_index(i))

        return conn.execute("SELECT COUNT(*) FROM organization_assets").fetchone()[0]


def seed(force: bool = False) -> int:
    init_db()
    with get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) FROM organizations").fetchone()[0]
        if count > 0 and not force:
            seed_assets(force=False)
            return count

        if force:
            conn.execute("DELETE FROM organization_assets")
            conn.execute("DELETE FROM organizations")

        for i, (name, org_type, status, sync, myglue, initials, fav) in enumerate(
            SAMPLE_ORGS
        ):
            notes = json.dumps(BEN_NOTES if name.startswith("Ben E.") else {})
            org_id = str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO organizations (
                    id, name, org_type, status, favorite, sync_status,
                    myglue_account, description, quick_notes, logo_initials,
                    last_viewed_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    org_id,
                    name,
                    org_type,
                    status,
                    1 if fav else 0,
                    sync,
                    myglue,
                    f"Documentation profile for {name}."
                    if not name.startswith("Ben")
                    else "Co-managed client. See quick notes for escalation and contacts.",
                    notes,
                    initials,
                    NOW if i < 6 else None,
                    NOW,
                    NOW,
                ),
            )
            _insert_assets(conn, org_id, asset_counts_for_index(i))
        return conn.execute("SELECT COUNT(*) FROM organizations").fetchone()[0]


if __name__ == "__main__":
    n = seed(force=True)
    print(f"Seeded {n} organizations")
    a = seed_assets(force=True)
    print(f"Seeded {a} assets")
