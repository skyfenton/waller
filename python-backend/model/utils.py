import random
from PIL import Image

COLOR_MAP = {"wall": (255, 0, 0)}
COLOR_MAP_VALS = set(COLOR_MAP.values())
    

def random_exclusive_color():
    while True:
        color = tuple(random.randint(0, 255) for _ in range(3))
        if color not in COLOR_MAP_VALS:
            return color


def show_mask(img, mask, color):
    bg = Image.new("RGB", img.size, tuple(color))
    bg.putalpha(255)
    # bg.save('bg.png')
    img.paste(bg, mask=mask)