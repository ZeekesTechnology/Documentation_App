"""Entry point for dev and PyInstaller-bundled production server."""
import os
import sys
from pathlib import Path

# PyInstaller extracts to a temp folder; ensure backend modules resolve.
if getattr(sys, "frozen", False):
    bundle_dir = Path(sys._MEIPASS)
    sys.path.insert(0, str(bundle_dir))
else:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from data_paths import ensure_data_dirs  # noqa: E402
from app import create_app  # noqa: E402


def main() -> None:
    data_dir = ensure_data_dirs()
    print(f"Documentation App data directory: {data_dir}", flush=True)
    port = int(os.environ.get("DOCAPP_PORT", "5000"))
    host = "127.0.0.1"
    mode = os.environ.get("DOCAPP_MODE", "development")

    static_dir = None
    if getattr(sys, "frozen", False):
        bundle_static = Path(sys._MEIPASS) / "static"
        if bundle_static.is_dir():
            static_dir = str(bundle_static)
    else:
        local_static = Path(__file__).resolve().parent / "static"
        if local_static.is_dir():
            static_dir = str(local_static)

    if static_dir:
        os.environ["DOCAPP_STATIC_DIR"] = static_dir

    application = create_app()

    if mode == "production":
        from waitress import serve

        print(f"Documentation App backend listening on http://{host}:{port}", flush=True)
        serve(application, host=host, port=port, threads=4)
    else:
        print(f"Documentation App backend (dev) on http://{host}:{port}", flush=True)
        application.run(
            host=host,
            port=port,
            debug=True,
            use_reloader=True,
            threaded=True,
        )


if __name__ == "__main__":
    main()
