"""Generate Windows app icons from the MenschDocs logo in Org Logos/."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Org Logos" / "MenschDocs 48x48 Logo.png"
BUILD = ROOT / "build"
ICO_SIZES = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Logo not found: {SRC}")

    BUILD.mkdir(exist_ok=True)
    logo = Image.open(SRC).convert("RGBA")
    icon_base = logo.resize((256, 256), Image.Resampling.LANCZOS)

    icon_base.save(BUILD / "icon.png")
    icon_base.save(BUILD / "icon.ico", format="ICO", sizes=ICO_SIZES)

    print(f"Generated {BUILD / 'icon.ico'}")
    print(f"Generated {BUILD / 'icon.png'}")


if __name__ == "__main__":
    main()
