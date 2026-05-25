"""Organization core asset counts and CRUD."""
import uuid
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from db import get_connection

bp = Blueprint("assets", __name__, url_prefix="/api/organizations")

ASSET_TYPES = (
    "checklists",
    "configurations",
    "contacts",
    "documents",
    "domain_tracker",
    "locations",
    "licenses",
    "passwords",
    "ssl_tracker",
    "wireless",
)


def empty_counts() -> dict[str, int]:
    return {t: 0 for t in ASSET_TYPES}


def counts_for_org(conn, org_id: str) -> dict[str, int]:
    rows = conn.execute(
        """
        SELECT asset_type, COUNT(*) AS n
        FROM organization_assets
        WHERE org_id = ?
        GROUP BY asset_type
        """,
        (org_id,),
    ).fetchall()
    counts = empty_counts()
    for row in rows:
        if row["asset_type"] in counts:
            counts[row["asset_type"]] = row["n"]
    return counts


def add_asset(org_id: str, asset_type: str, title: str) -> dict:
    if asset_type not in ASSET_TYPES:
        raise ValueError(f"Invalid asset type: {asset_type}")
    now = datetime.now(timezone.utc).isoformat()
    asset_id = str(uuid.uuid4())
    with get_connection() as conn:
        org = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not org:
            raise LookupError("Organization not found")
        conn.execute(
            """
            INSERT INTO organization_assets (id, org_id, asset_type, title, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (asset_id, org_id, asset_type, title.strip() or "Untitled", now),
        )
    return {"id": asset_id, "orgId": org_id, "type": asset_type, "title": title}


@bp.get("/<org_id>/asset-counts")
def get_asset_counts(org_id: str):
    with get_connection() as conn:
        org = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not org:
            return jsonify({"error": "Not found"}), 404
        counts = counts_for_org(conn, org_id)
    return jsonify({"orgId": org_id, "counts": counts})


@bp.get("/<org_id>/assets")
def list_assets(org_id: str):
    asset_type = request.args.get("type", "").strip()
    if asset_type and asset_type not in ASSET_TYPES:
        return jsonify({"error": "Invalid asset type"}), 400

    with get_connection() as conn:
        org = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not org:
            return jsonify({"error": "Not found"}), 404

        if asset_type:
            rows = conn.execute(
                """
                SELECT id, org_id, asset_type, title, created_at
                FROM organization_assets
                WHERE org_id = ? AND asset_type = ?
                ORDER BY created_at DESC
                """,
                (org_id, asset_type),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT id, org_id, asset_type, title, created_at
                FROM organization_assets
                WHERE org_id = ?
                ORDER BY asset_type ASC, created_at DESC
                """,
                (org_id,),
            ).fetchall()

    return jsonify(
        {
            "assets": [
                {
                    "id": r["id"],
                    "orgId": r["org_id"],
                    "type": r["asset_type"],
                    "title": r["title"],
                    "createdAt": r["created_at"],
                }
                for r in rows
            ]
        }
    )


@bp.post("/<org_id>/assets")
def create_asset(org_id: str):
    data = request.get_json(force=True) or {}
    asset_type = (data.get("type") or "").strip()
    title = (data.get("title") or "").strip()
    if asset_type not in ASSET_TYPES:
        return jsonify({"error": "Invalid or missing asset type"}), 400
    if not title:
        return jsonify({"error": "title is required"}), 400
    try:
        asset = add_asset(org_id, asset_type, title)
    except LookupError:
        return jsonify({"error": "Not found"}), 404
    with get_connection() as conn:
        counts = counts_for_org(conn, org_id)
    return jsonify({"asset": asset, "counts": counts}), 201


@bp.delete("/<org_id>/assets/<asset_id>")
def delete_asset(org_id: str, asset_id: str):
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT id FROM organization_assets
            WHERE id = ? AND org_id = ?
            """,
            (asset_id, org_id),
        ).fetchone()
        if not row:
            return jsonify({"error": "Not found"}), 404
        conn.execute(
            "DELETE FROM organization_assets WHERE id = ? AND org_id = ?",
            (asset_id, org_id),
        )
        counts = counts_for_org(conn, org_id)
    return jsonify({"ok": True, "counts": counts})
