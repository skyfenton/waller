export function isFileWithPreview(
  file: File
): file is File & { preview: string } {
  return 'preview' in file && typeof file.preview === 'string';
}

/**
 * Given a file, returns an image element from the file's preview.
 * Throws an error if the file does not have a preview property.
 * @param src The file to get the image from.
 * @returns An image element.
 * @throws If the file does not have a preview property.
 */
export function getImage(src: File): HTMLImageElement {
  if (isFileWithPreview(src)) {
    const img = new Image();
    img.src = src.preview;
    return img;
  } else {
    throw new Error(`File ${src.name} does not have a preview property`);
  }
}
