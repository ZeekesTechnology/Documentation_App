"""Shared logo background removal for MenschDocs branding assets."""
from collections import deque

from PIL import Image


def is_background_white(r: int, g: int, b: int) -> bool:
    return r > 240 and g > 240 and b > 240


def remove_outer_white_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
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

    return img
