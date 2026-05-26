"""Remove outer white background from logo PNG, preserving inner white fills."""
from pathlib import Path

from PIL import Image

from logo_bg import remove_outer_white_background

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Org Logos" / "MenschDocs 48x48 Logo.png"
OUT = ROOT / "frontend" / "public" / "logo.png"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Logo not found: {SRC}")

    logo = remove_outer_white_background(Image.open(SRC))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    logo.save(OUT, "PNG")
    print(f"Saved transparent logo to {OUT} ({logo.size[0]}x{logo.size[1]})")


if __name__ == "__main__":
    main()
