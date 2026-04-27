#!/usr/bin/env python3
"""Generate placeholder PWA + Capacitor app icons matching the LogoMark design.

The mark is a blue (#0052CC) rounded square containing a white "A" with a
crossbar — same design as components/Logo.tsx LogoMark.
"""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw

BLUE = (0, 82, 204, 255)
WHITE = (255, 255, 255, 255)

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_ICONS = ROOT / "public" / "icons"
RESOURCES = ROOT / "resources"


def draw_mark(size: int, *, transparent_bg: bool = False, padding_ratio: float = 0.0) -> Image.Image:
    """Draw the ARIAS mark at the requested pixel size.

    padding_ratio: fraction of the canvas to leave as transparent margin around
    the rounded square (used for adaptive icons / source icons that need a
    safe area).
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * padding_ratio)
    inner = size - 2 * pad
    radius = int(inner * 0.2)

    if transparent_bg and padding_ratio > 0:
        draw.rounded_rectangle(
            (pad, pad, pad + inner, pad + inner), radius=radius, fill=BLUE
        )
    else:
        draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=BLUE)

    def s(x: float) -> float:
        return pad + (x / 40.0) * inner

    a_polygon = [
        (s(11), s(28)),
        (s(20), s(11)),
        (s(29), s(28)),
        (s(24.5), s(28)),
        (s(20), s(19)),
        (s(15.5), s(28)),
    ]
    draw.polygon(a_polygon, fill=WHITE)

    cross_x0 = s(17)
    cross_y0 = s(24)
    cross_x1 = s(23)
    cross_y1 = s(26)
    draw.rectangle((cross_x0, cross_y0, cross_x1, cross_y1), fill=BLUE)

    return img


def write(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG")
    print(f"  wrote {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]})")


def main() -> None:
    print("Generating PWA icons under public/icons/ ...")
    for size in (72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024):
        write(draw_mark(size), PUBLIC_ICONS / f"icon-{size}.png")

    write(draw_mark(180), PUBLIC_ICONS / "apple-touch-icon.png")
    write(draw_mark(32), PUBLIC_ICONS / "favicon-32.png")
    write(draw_mark(16), PUBLIC_ICONS / "favicon-16.png")

    print("Generating Capacitor source assets under resources/ ...")
    write(draw_mark(1024), RESOURCES / "icon.png")
    write(draw_mark(1024, transparent_bg=True, padding_ratio=0.2), RESOURCES / "icon-foreground.png")
    bg = Image.new("RGBA", (1024, 1024), WHITE)
    write(bg, RESOURCES / "icon-background.png")
    splash = Image.new("RGBA", (2732, 2732), WHITE)
    mark = draw_mark(800)
    splash.alpha_composite(mark, ((2732 - 800) // 2, (2732 - 800) // 2))
    write(splash, RESOURCES / "splash.png")

    print("Done.")


if __name__ == "__main__":
    main()
