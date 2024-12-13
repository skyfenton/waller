from transformers import pipeline
from PIL import Image, ImageChops
import random

MODEL = "facebook/mask2former-swin-large-ade-semantic"

WALL_LABELS = set(['wall'])
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


class WallerProcess():
  def __init__(self) -> None:
    self.pipe = pipeline(
      task="image-segmentation", 
      model=MODEL,
      num_workers=1
    )
    
  def process_image(self, image_path, output_path: str):
    img = Image.open(image_path)
    resized = img.resize(
        get_shrink_bounds(img, 1000),
        Image.Resampling.BILINEAR
        )
    segments = self.pipe(resized,
              subtask="semantic",
              overlap_mask_area_threshold=0.9
    )
    all_masks = Image.new("L", resized.size, 0)
    for segment in segments:
      if segment["label"] in WALL_LABELS:
        all_masks.paste(segment["mask"])
    
    out = Image.new("RGB", resized.size, (255, 0, 0, 0))
    out.putalpha(ImageChops.invert(all_masks))
    out.save(output_path)