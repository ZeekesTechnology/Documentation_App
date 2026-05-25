"""Persist org-scoped frontend asset trees (passwords, documents) in SQLite."""
import json
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from db import get_connection

bp = Blueprint("org_storage", __name__, url_prefix="/api/organizations")

ALLOWED_KEYS = frozenset({"passwords", "documents"})


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@bp.get("/<org_id>/local-storage/<storage_key>")
def get_local_storage(org_id: str, storage_key: str):
    if storage_key not in ALLOWED_KEYS:
        return jsonify({"error": "Invalid storage key"}), 400

    with get_connection() as conn:
        org = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not org:
            return jsonify({"error": "Not found"}), 404

        row = conn.execute(
            """
            SELECT payload FROM org_local_storage
            WHERE org_id = ? AND storage_key = ?
            """,
            (org_id, storage_key),
        ).fetchone()

    items = json.loads(row["payload"]) if row else []
    if not isinstance(items, list):
        items = []
    return jsonify({"orgId": org_id, "storageKey": storage_key, "items": items})


@bp.put("/<org_id>/local-storage/<storage_key>")
def put_local_storage(org_id: str, storage_key: str):
    if storage_key not in ALLOWED_KEYS:
        return jsonify({"error": "Invalid storage key"}), 400

    data = request.get_json(force=True) or {}
    items = data.get("items")
    if not isinstance(items, list):
        return jsonify({"error": "items must be an array"}), 400

    now = _now()
    payload = json.dumps(items)

    with get_connection() as conn:
        org = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not org:
            return jsonify({"error": "Not found"}), 404

        conn.execute(
            """
            INSERT INTO org_local_storage (org_id, storage_key, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(org_id, storage_key) DO UPDATE SET
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (org_id, storage_key, payload, now),
        )

    return jsonify({"ok": True, "orgId": org_id, "storageKey": storage_key, "items": items})
