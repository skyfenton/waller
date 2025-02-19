import pytest
from src.waller.waller_lib import get_shrink_bounds
from PIL import Image


def test_get_shrink_bounds_width_bound():
    image = Image.new("RGB", (5000, 1000))
    assert get_shrink_bounds(image, 2000) == (2000, 400)


def test_get_shrink_bounds_height_bound():
    image = Image.new("RGB", (1000, 5000))
    assert get_shrink_bounds(image, 1200) == (240, 1200)


def test_get_shrink_bounds_zero():
    image = Image.new("RGB", (5000, 1000))
    with pytest.raises(ValueError) as e_info:
        get_shrink_bounds(image, 0)
    assert e_info.match("Desired max_dimension must be greater than 0")
