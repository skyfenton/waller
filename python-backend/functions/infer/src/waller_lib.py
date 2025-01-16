from transformers import pipeline
from PIL import Image, ImageChops

MODEL = "facebook/mask2former-swin-large-ade-semantic"

WALL_LABELS = set(['wall'])

def get_shrink_bounds(img: Image.Image, width: int) -> tuple[int, int]:
    """ Returns a tuple representing the new size fitting given width which
    preserves aspect ratio (width, height divided by shrink factor between
    widths) """
    return (width, int(img.size[1] // (img.size[0] / width)))


class WallerProcess():
  def __init__(self) -> None:
    self.pipe = pipeline(
      task="image-segmentation", 
      model=MODEL,
      num_workers=1,
      cache_dir='./hf_cache'
    )
    
  def process_image(self, img: Image.Image) -> Image.Image:
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
    return out