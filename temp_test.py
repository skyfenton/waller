from transformers import pipeline
from PIL import Image
import random

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
    
    
def get_shrink_bounds(img, width):
    # return tuple for size of (width, height/shrink factor)
    return (width, int(img.size[1] // (img.size[0] / width)))


input_img = Image.open("temp/input.png")
# print(get_shrink_bounds(input_img, 800))
resized = input_img.resize(
    get_shrink_bounds(input_img, 1000),
    Image.Resampling.BILINEAR
    )
segmenter = pipeline(
    task="image-segmentation", model="facebook/mask2former-swin-large-ade-semantic"
)
segments = segmenter(resized,
                     subtask="semantic",
                    #  threshold=0.2,
                    #  mask_threshold=0.8,
                     overlap_mask_area_threshold=0.9
                     )

all_masks = Image.new("RGBA", resized.size, (0, 0, 0, 0))
for segment in segments:
    if segment["label"] in COLOR_MAP:
        color = COLOR_MAP[segment["label"]]
    else:
        color = random_exclusive_color()
    print(segment["label"], color)
    show_mask(all_masks, segment["mask"], color)
all_masks.save("temp/masks_output.png")
# overlay = all_masks.point(lambda p: (p[0], p[1], p[2]) if p[3] != 0 else p)
output = Image.blend(input_img.convert("RGBA"), all_masks.resize(input_img.size, Image.Resampling.BILINEAR), 0.4)
output.save("temp/output.png")
