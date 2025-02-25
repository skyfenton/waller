import os

from PIL import Image, ImageChops
from transformers import pipeline

MODEL = os.getenv("MODEL_PATH")
WALL_LABELS = set(["wall"])


def get_shrink_bounds(img: Image.Image, max_dimension: int) -> tuple[int, int]:
    """
    Returns a tuple of (width, height) after shrinking all dimensions to under
    the max_dimension value while preserving the current aspect ratio.
    """
    if max_dimension == 0:
        raise ValueError("Desired max_dimension must be greater than 0")
    ratio = max(img.size[0] / max_dimension, img.size[1] / max_dimension)
    return (round(img.size[0] / ratio), round(img.size[1] / ratio))


class WallerProcess:
    def __init__(self) -> None:
        if MODEL is None:
            raise ValueError("MODEL_PATH environment variable not set")
        self.segmenter = pipeline(
            task="image-segmentation",
            model=MODEL,
            num_workers=1,
            use_fast=True,
        )

    def process_image(self, img: Image.Image) -> Image.Image:
        resized = img.resize(get_shrink_bounds(img, 1000), Image.Resampling.BILINEAR)
        segments = self.segmenter(
            resized, subtask="semantic", overlap_mask_area_threshold=0.9
        )
        all_masks = Image.new("L", resized.size, 0)
        for segment in segments:
            if segment["label"] in WALL_LABELS:
                all_masks.paste(segment["mask"])

        out = Image.new("RGB", resized.size, (255, 0, 0, 0))
        out.putalpha(ImageChops.invert(all_masks))
        return out
