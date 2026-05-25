"""Organizations API routes."""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, jsonify, request

from data_paths import resolve_data_dir
from assets import add_asset
from db import get_connection

bp = Blueprint("organizations", __name__, url_prefix="/api/organizations")

SORT_COLUMNS = {
    "name": "name",
    "type": "org_type",
    "status": "status",
    "myglue": "myglue_account",
    "sync": "sync_status",
    "updated": "updated_at",
}


def row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "shortName": row["short_name"],
        "type": row["org_type"],
        "status": row["status"],
        "favorite": bool(row["favorite"]),
        "syncStatus": row["sync_status"],
        "myglueAccount": row["myglue_account"],
        "description": row["description"],
        "alertMessage": row["alert_message"],
        "parentOrgId": row["parent_org_id"],
        "locationName": row["location_name"],
        "address": row["address"],
        "city": row["city"],
        "country": row["country"],
        "stateProvince": row["state_province"],
        "zipCode": row["zip_code"],
        "logoPath": row["logo_path"],
        "quickNotes": json.loads(row["quick_notes"] or "{}"),
        "logoInitials": row["logo_initials"],
        "lastViewedAt": row["last_viewed_at"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


@bp.get("")
def list_organizations():
    sort = request.args.get("sort", "name")
    order = request.args.get("order", "asc").lower()
    search = request.args.get("search", "").strip()
    org_type = request.args.get("type", "").strip()
    status = request.args.get("status", "").strip()
    favorites_only = request.args.get("favorites") == "1"

    col = SORT_COLUMNS.get(sort, "name")
    direction = "DESC" if order == "desc" else "ASC"

    clauses = []
    params: list = []

    if search:
        clauses.append("(name LIKE ? OR description LIKE ?)")
        like = f"%{search}%"
        params.extend([like, like])
    if org_type:
        clauses.append("org_type = ?")
        params.append(org_type)
    if status:
        clauses.append("status = ?")
        params.append(status)
    if favorites_only:
        clauses.append("favorite = 1")

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"SELECT * FROM organizations {where} ORDER BY {col} {direction}"

    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM organizations").fetchone()[0]

    return jsonify(
        {
            "organizations": [row_to_dict(r) for r in rows],
            "total": total,
            "filtered": len(rows),
        }
    )


@bp.get("/recents")
def recent_organizations():
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM organizations
            WHERE last_viewed_at IS NOT NULL
            ORDER BY last_viewed_at DESC
            LIMIT 8
            """
        ).fetchall()
    return jsonify({"organizations": [row_to_dict(r) for r in rows]})


@bp.get("/favorites")
def favorite_organizations():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM organizations WHERE favorite = 1 ORDER BY name ASC"
        ).fetchall()
    return jsonify({"organizations": [row_to_dict(r) for r in rows]})


@bp.get("/<org_id>")
def get_organization(org_id: str):
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            "UPDATE organizations SET last_viewed_at = ? WHERE id = ?",
            (now, org_id),
        )
        row = conn.execute(
            "SELECT * FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(row_to_dict(row))


def _parse_org_payload(data: dict, org_id: str | None = None):
    name = (data.get("name") or "").strip()
    org_type = (data.get("type") or "").strip()
    status = (data.get("status") or "").strip()
    location_name = (data.get("locationName") or "").strip()
    address = (data.get("address") or "").strip()

    missing = []
    if not name:
        missing.append("name")
    if not org_type:
        missing.append("type")
    if not status:
        missing.append("status")
    if not location_name:
        missing.append("locationName")
    if not address:
        missing.append("address")
    if missing:
        return None, (jsonify({"error": f"Required fields missing: {', '.join(missing)}"}), 400)

    parent_org_id = (data.get("parentOrgId") or "").strip() or None
    if org_id is not None and parent_org_id == org_id:
        return None, (jsonify({"error": "Organization cannot be its own parent"}), 400)
    if parent_org_id:
        with get_connection() as conn:
            parent = conn.execute(
                "SELECT id FROM organizations WHERE id = ?", (parent_org_id,)
            ).fetchone()
        if not parent:
            return None, (jsonify({"error": "Parent organization not found"}), 400)

    short_name = (data.get("shortName") or "").strip()
    initials_source = short_name or name
    initials = "".join(w[0].upper() for w in initials_source.split()[:2])[:2] or "OR"

    return {
        "name": name,
        "short_name": short_name,
        "org_type": org_type,
        "status": status,
        "location_name": location_name,
        "address": address,
        "city": data.get("city", ""),
        "country": data.get("country", ""),
        "state_province": data.get("stateProvince", ""),
        "zip_code": data.get("zipCode", ""),
        "description": data.get("description", ""),
        "alert_message": data.get("alertMessage", ""),
        "parent_org_id": parent_org_id,
        "logo_initials": initials,
    }, None


@bp.patch("/<org_id>")
def update_organization(org_id: str):
    data = request.get_json(force=True) or {}
    parsed, err = _parse_org_payload(data, org_id=org_id)
    if err:
        return err

    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not row:
            return jsonify({"error": "Not found"}), 404
        conn.execute(
            """
            UPDATE organizations SET
                name = ?, short_name = ?, org_type = ?, status = ?,
                description = ?, alert_message = ?, parent_org_id = ?,
                location_name = ?, address = ?, city = ?, country = ?,
                state_province = ?, zip_code = ?, logo_initials = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                parsed["name"],
                parsed["short_name"],
                parsed["org_type"],
                parsed["status"],
                parsed["description"],
                parsed["alert_message"],
                parsed["parent_org_id"],
                parsed["location_name"],
                parsed["address"],
                parsed["city"],
                parsed["country"],
                parsed["state_province"],
                parsed["zip_code"],
                parsed["logo_initials"],
                now,
                org_id,
            ),
        )
        updated = conn.execute(
            "SELECT * FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
    return jsonify(row_to_dict(updated))


@bp.post("")
def create_organization():
    data = request.get_json(force=True) or {}
    parsed, err = _parse_org_payload(data)
    if err:
        return err

    now = datetime.now(timezone.utc).isoformat()
    org_id = str(uuid.uuid4())

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO organizations (
                id, name, short_name, org_type, status, favorite, sync_status,
                myglue_account, description, alert_message, parent_org_id,
                location_name, address, city, country, state_province, zip_code,
                logo_path, quick_notes, logo_initials, last_viewed_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, NULL, ?, ?)
            """,
            (
                org_id,
                parsed["name"],
                parsed["short_name"],
                parsed["org_type"],
                parsed["status"],
                data.get("syncStatus", "Not Synced"),
                data.get("myglueAccount", "Disabled"),
                parsed["description"],
                parsed["alert_message"],
                parsed["parent_org_id"],
                parsed["location_name"],
                parsed["address"],
                parsed["city"],
                parsed["country"],
                parsed["state_province"],
                parsed["zip_code"],
                "",
                parsed["logo_initials"],
                now,
                now,
            ),
        )
        row = conn.execute(
            "SELECT * FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()

    if parsed["location_name"]:
        add_asset(org_id, "locations", parsed["location_name"])

    return jsonify(row_to_dict(row)), 201


def _save_logo(org_id: str, file_storage) -> str:
    ext = Path(file_storage.filename or "").suffix.lower() or ".png"
    if ext not in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}:
        ext = ".png"
    logos_dir = resolve_data_dir() / "attachments" / "logos"
    logos_dir.mkdir(parents=True, exist_ok=True)
    rel_path = f"logos/{org_id}{ext}"
    dest = logos_dir / f"{org_id}{ext}"
    file_storage.save(dest)
    with get_connection() as conn:
        conn.execute(
            "UPDATE organizations SET logo_path = ? WHERE id = ?",
            (rel_path, org_id),
        )
    return rel_path


@bp.post("/<org_id>/logo")
def upload_organization_logo(org_id: str):
    file_storage = request.files.get("file")
    if not file_storage or not file_storage.filename:
        return jsonify({"error": "No file provided"}), 400
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    rel_path = _save_logo(org_id, file_storage)
    return jsonify({"logoPath": rel_path})


@bp.patch("/<org_id>/quick-notes")
def update_quick_notes(org_id: str):
    data = request.get_json(force=True) or {}
    notes = data.get("quickNotes")
    if not isinstance(notes, dict):
        return jsonify({"error": "quickNotes object is required"}), 400

    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not row:
            return jsonify({"error": "Not found"}), 404
        conn.execute(
            "UPDATE organizations SET quick_notes = ?, updated_at = ? WHERE id = ?",
            (json.dumps(notes), now, org_id),
        )
        updated = conn.execute(
            "SELECT * FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
    return jsonify(row_to_dict(updated))


@bp.patch("/<org_id>/favorite")
def toggle_favorite(org_id: str):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT favorite FROM organizations WHERE id = ?", (org_id,)
        ).fetchone()
        if not row:
            return jsonify({"error": "Not found"}), 404
        new_val = 0 if row["favorite"] else 1
        conn.execute(
            "UPDATE organizations SET favorite = ? WHERE id = ?",
            (new_val, org_id),
        )
    return jsonify({"favorite": bool(new_val)})


@bp.delete("/<org_id>")
def delete_organization(org_id: str):
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM organizations WHERE id = ?", (org_id,))
    if cur.rowcount == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"ok": True})
