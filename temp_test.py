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


input_img = Image.open("temp/input.jpg")
segmenter = pipeline(
    task="image-segmentation", model="shi-labs/oneformer_ade20k_swin_large"
)
segments = segmenter(input_img, 
                     threshold=0,
                    #  mask_threshold=0.3,
                    #  overlap_mask_area_threshold=0.3
                     )

all_masks = Image.new("RGBA", input_img.size, (0, 0, 0, 0))
for segment in segments:
    if segment["label"] in COLOR_MAP:
        color = COLOR_MAP[segment["label"]]
    else:
        color = random_exclusive_color()
    print(segment["label"], color)
    show_mask(all_masks, segment["mask"], color)
all_masks.save("temp/masks_output.png")
# overlay = all_masks.point(lambda p: (p[0], p[1], p[2]) if p[3] != 0 else p)
output = Image.blend(input_img.convert("RGBA"), all_masks, 0.4)
output.save("temp/output.png")
