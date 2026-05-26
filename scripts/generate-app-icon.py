"""Generate Windows app icons from the MenschDocs logo in Org Logos/."""
from pathlib import Path

from PIL import Image

from logo_bg import remove_outer_white_background

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Org Logos" / "MenschDocs 48x48 Logo.png"
BUILD = ROOT / "build"
ICO_SIZES = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Logo not found: {SRC}")

    BUILD.mkdir(exist_ok=True)
    logo = remove_outer_white_background(Image.open(SRC))
    icon_256 = logo.resize((256, 256), Image.Resampling.LANCZOS)

    icon_256.save(BUILD / "icon.png")
    icon_256.save(BUILD / "icon.ico", format="ICO", sizes=ICO_SIZES)

    with Image.open(BUILD / "icon.ico") as icon:
        if icon.size != (256, 256):
            raise SystemExit(
                f"Generated icon.ico primary size is {icon.size}, expected (256, 256)."
            )

    print(f"Generated {BUILD / 'icon.ico'}")
    print(f"Generated {BUILD / 'icon.png'}")


if __name__ == "__main__":
    main()
