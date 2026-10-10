"""Draws the Pocket Ledger app icons as PNG files for the phone app (PWA).

Run from the project folder:  python tools/make_icons.py
Needs Pillow:                 pip install pillow
"""
import os

from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "web", "icons")
DARK, MINT, MID = "#12302a", "#5fd3b8", "#3a8f7c"


def draw(size, maskable=False):
    """maskable=True: full-bleed background, logo kept inside the centre 80%.
    Android cuts icons into circles/squircles; this keeps the logo from being clipped."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 256
    if maskable:
        d.rectangle([0, 0, size, size], fill=DARK)
        s *= 0.8
        off = size * 0.1
    else:
        d.rounded_rectangle([8 * s, 8 * s, 248 * s, 248 * s], 56 * s, fill=DARK)
        off = 0
    box = lambda x0, y0, x1, y1: [off + x0 * s, off + y0 * s, off + x1 * s, off + y1 * s]
    d.rounded_rectangle(box(40, 64, 216, 192), 28 * s, fill=MINT)  # wallet
    d.rectangle(box(40, 96, 216, 120), fill=MID)                    # stripe
    d.rounded_rectangle(box(140, 132, 216, 176), 22 * s, fill=DARK)  # clasp
    d.ellipse(box(162, 144, 182, 164), fill=MINT)                    # button
    return img


os.makedirs(OUT, exist_ok=True)
for name, size, mask in [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-maskable-512.png", 512, True),
    ("apple-touch-icon.png", 180, True),  # iPhone adds its own rounded corners
]:
    draw(size, mask).save(os.path.join(OUT, name))
    print("made", name)
