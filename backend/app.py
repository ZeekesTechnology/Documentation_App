import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from dashboard import bp as dashboard_bp
from assets import bp as assets_bp
from data_paths import ensure_data_dirs, resolve_data_dir
from organizations import bp as organizations_bp
from org_storage import bp as org_storage_bp
from seed import seed


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
    if static_dir and Path(static_dir).is_dir():
        app.static_folder = static_dir
        app.static_url_path = ""

    @app.get("/api/health")
    def health():
        return jsonify(
            {
                "ok": True,
                "service": "menschdocs",
                "dataDir": str(resolve_data_dir()),
            }
        )

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
