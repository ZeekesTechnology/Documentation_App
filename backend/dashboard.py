"""Dashboard summary API."""
from flask import Blueprint, jsonify

from db import get_connection
from usage_stats import build_system_usage

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@bp.get("")
def dashboard():
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM organizations").fetchone()[0]
        active = conn.execute(
            "SELECT COUNT(*) FROM organizations WHERE status = 'Active'"
        ).fetchone()[0]
        favorites = conn.execute(
            "SELECT COUNT(*) FROM organizations WHERE favorite = 1"
        ).fetchone()[0]
        recents = conn.execute(
            """
            SELECT * FROM organizations
            WHERE last_viewed_at IS NOT NULL
            ORDER BY last_viewed_at DESC LIMIT 5
            """
        ).fetchall()
        expiring = conn.execute(
            """
            SELECT id, name, 'License renewal' AS item, updated_at AS due_date
            FROM organizations
            ORDER BY updated_at ASC LIMIT 3
            """
        ).fetchall()
        system_usage = build_system_usage(conn)

    from organizations import row_to_dict

    return jsonify(
        {
            "stats": {
                "organizations": total,
                "activeClients": active,
                "favorites": favorites,
            },
            "recentClients": [row_to_dict(r) for r in recents],
            "expiringItems": [
                {
                    "id": r["id"],
                    "organization": r["name"],
                    "item": r["item"],
                    "dueDate": r["due_date"],
                }
                for r in expiring
            ],
            "systemUsage": system_usage,
        }
    )
