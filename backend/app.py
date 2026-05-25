import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from dashboard import bp as dashboard_bp
from assets import bp as assets_bp
from data_paths import ensure_data_dirs, resolve_data_dir
from organizations import bp as organizations_bp
from org_storage import bp as org_storage_bp
from seed import seed


def _load_build_info(static_dir: str | None) -> dict:
    if not static_dir:
        return {}
    info_path = Path(static_dir) / "build-info.json"
    if not info_path.is_file():
        return {}
    try:
        import json

        return json.loads(info_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def create_app() -> Flask:
    data_dir = ensure_data_dirs()
    seed()
    app = Flask(__name__)
    app.config["DATA_DIR"] = str(data_dir)
    app.register_blueprint(organizations_bp)
    app.register_blueprint(org_storage_bp)
    app.register_blueprint(assets_bp)
    app.register_blueprint(dashboard_bp)

    static_dir = os.environ.get("DOCAPP_STATIC_DIR")
    build_info = _load_build_info(static_dir)
    if static_dir and Path(static_dir).is_dir():
        app.static_folder = static_dir
        app.static_url_path = ""

    @app.after_request
    def disable_static_cache(response):
        if static_dir and response.status_code == 200:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

    @app.get("/api/health")
    def health():
        return jsonify(
            {
                "ok": True,
                "service": "menschdocs",
                "dataDir": str(resolve_data_dir()),
                "build": build_info,
            }
        )

    @app.get("/api/build-info")
    def build_info_route():
        return jsonify(build_info or {"error": "Build info unavailable"})

    @app.get("/api/config")
    def config():
        root = resolve_data_dir()
        return jsonify(
            {
                "dataDir": str(root),
                "subdirs": {
                    "logs": str(root / "logs"),
                    "projects": str(root / "projects"),
                    "attachments": str(root / "attachments"),
                    "db": str(root / "db"),
                },
            }
        )

    if static_dir and Path(static_dir).is_dir():

        @app.route("/", defaults={"path": ""}, methods=["GET"])
        @app.route("/<path:path>", methods=["GET"])
        def serve_spa(path: str):
            if path.startswith("api/"):
                return jsonify({"error": "Not found"}), 404
            if path and (Path(static_dir) / path).is_file():
                return send_from_directory(static_dir, path)
            return send_from_directory(static_dir, "index.html")

    return app


app = create_app()
