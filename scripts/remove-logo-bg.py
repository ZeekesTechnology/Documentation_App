"""Remove outer white background from logo PNG, preserving inner white document fill."""
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Install Pillow: pip install pillow")


def is_background_white(r: int, g: int, b: int) -> bool:
    return r > 240 and g > 240 and b > 240


def main() -> None:
    src = Path(
        r"C:\Users\Admin\.cursor\projects\s-Cursor-MenschDocs\assets"
        r"\c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_aa46dbe71d67542e92fba8aef6947201_images_image-3a1179b3-e630-455d-aee4-3047dd60e103.png"
    )
    out = Path(__file__).resolve().parent.parent / "frontend" / "public" / "logo.png"

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    visited = [[False] * h for _ in range(w)]
    queue: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if visited[x][y]:
            return
        r, g, b, _ = pixels[x, y]
        if is_background_white(r, g, b):
            visited[x][y] = True
            queue.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                r, g, b, _ = pixels[nx, ny]
                if is_background_white(r, g, b):
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    for x in range(w):
        for y in range(h):
            if visited[x][y]:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)

    img.save(out, "PNG")
    print(f"Saved transparent logo to {out} ({w}x{h})")


if __name__ == "__main__":
    main()
