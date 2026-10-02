#!/usr/bin/env python3
"""Generate the placeholder icon, splash, and session chime. Safe to rerun."""

import math
import struct
import wave
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "assets" / "images"
SOUND_PATH = ROOT / "assets" / "sounds" / "complete.wav"

BG = (12, 12, 14, 255)
EMBER = (224, 122, 76, 255)
WHITE = (255, 255, 255, 255)


def write_png(path: Path, width: int, height: int, pixels) -> None:
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        raw.extend(pixels(y))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def blend(color, alpha: float):
    return (
        color[0],
        color[1],
        color[2],
        max(0, min(255, round(color[3] * alpha))),
    )


def ring_pixel(x: int, y: int, width: int, height: int, color, background, radius_ratio: float, stroke_ratio: float):
    cx = (width - 1) / 2
    cy = (height - 1) / 2
    dx = x - cx
    dy = y - cy
    distance = math.hypot(dx, dy)
    radius = width * radius_ratio
    stroke = width * stroke_ratio
    edge = abs(distance - radius) - stroke / 2
    coverage = max(0.0, min(1.0, 0.75 - edge))
    if coverage <= 0:
        return background
    if background[3] == 0:
        return blend(color, coverage)
    return tuple(round(background[channel] * (1 - coverage) + color[channel] * coverage) for channel in range(4))


def make_image(path: Path, size: int, color, background, radius_ratio: float, stroke_ratio: float) -> None:
    def pixels(y: int):
        row = bytearray()
        for x in range(size):
            row.extend(ring_pixel(x, y, size, size, color, background, radius_ratio, stroke_ratio))
        return row

    write_png(path, size, size, pixels)


def make_chime(path: Path) -> None:
    sample_rate = 22050
    duration = 0.55
    count = int(sample_rate * duration)
    frames = bytearray()
    for index in range(count):
        t = index / sample_rate
        envelope = math.exp(-4.2 * t) * (1 - math.exp(-80 * t))
        sample = envelope * (
            0.55 * math.sin(2 * math.pi * 523.25 * t) + 0.35 * math.sin(2 * math.pi * 783.99 * t)
        )
        value = max(-1, min(1, sample * 0.35))
        frames.extend(struct.pack("<h", round(value * 32767)))

    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(frames)


def main() -> None:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    transparent = (0, 0, 0, 0)
    make_image(IMAGE_DIR / "icon.png", 1024, EMBER, BG, 0.30, 0.045)
    make_image(IMAGE_DIR / "splash-icon.png", 512, EMBER, transparent, 0.30, 0.05)
    make_image(IMAGE_DIR / "favicon.png", 48, EMBER, BG, 0.30, 0.08)
    make_image(IMAGE_DIR / "android-icon-foreground.png", 1024, EMBER, transparent, 0.22, 0.034)
    make_image(IMAGE_DIR / "android-icon-monochrome.png", 1024, WHITE, transparent, 0.22, 0.034)
    make_image(IMAGE_DIR / "android-icon-background.png", 256, BG, BG, 0.3, 0.0)
    make_chime(SOUND_PATH)


if __name__ == "__main__":
    main()
