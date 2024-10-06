import { Button } from '@/components/ui/button';
import { isFileWithPreview } from '@/lib/utils';
import { WallerJob } from '@/types';

import { Stage, Container, Sprite } from '@pixi/react';
import { useEffect, useState, useRef } from 'react';

import { debounce } from 'lodash';

/**
 * Given a file, returns an image element from the file's preview.
 * Throws an error if the file does not have a preview property.
 * @param src The file to get the image from.
 * @returns An image element.
 * @throws If the file does not have a preview property.
 */
function getImage(src: File) {
  if (isFileWithPreview(src)) {
    const img = new Image();
    img.src = src.preview;
    return img;
  } else {
    throw new Error(`File ${src.name} does not have a preview property`);
  }
}

// TODO: Pull up hook to hooks folder, maybe move everything to a preview
// component folder
const useResize = (elementRef: React.RefObject<HTMLElement>, ratio: number) => {
  // TODO: Pull up defaults to some kind of config file
  // TODO: Cap max height to keep from scrolling out of view
  const [size, setSize] = useState([0, 0]);

  useEffect(() => {
    const onResize = () => {
      requestAnimationFrame(() => {
        if (elementRef.current) {
          // console.log(
          //   'resizing to ',
          //   elementRef.current.clientWidth,
          //   Math.floor(elementRef.current.clientWidth / ratio)
          // );

          // BUG: resizing has extra margin when resizing window smaller than canvas width
          setSize([
            elementRef.current.clientWidth,
            Math.floor(elementRef.current.clientWidth / ratio)
          ]);
        } else {
          console.warn(
            'Cannot resize, elementRef.current is null...',
            elementRef.current
          );
        }
      });
    };

    const debouncedResize = debounce(onResize, 100);

    onResize();
    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return size;
};

// TODO: Come up with better name than Edit/Image Page?
export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
}) {
  const jobImg = getImage(props.job.image);
  const maskImgSrc =
    (import.meta.env.VITE_SERVER_URL as string) + `/images/${props.job.id}.png`;

  const previewArea = useRef<HTMLDivElement>(null);
  const [width, height] = useResize(previewArea, jobImg.width / jobImg.height);
  return (
    <div className="container flex min-h-screen flex-col justify-evenly">
      <div ref={previewArea}>
        {isFileWithPreview(props.job.image) ? (
          <Stage
            width={width}
            height={height}
            options={{
              autoDensity: true
            }}
          >
            <Container>
              <Sprite width={width} height={height} image={jobImg} />
            </Container>
          </Stage>
        ) : (
          <h3>Loading picture...</h3>
        )}
      </div>
      <p>id: {props.job.id}</p>
      <Button
        variant="destructive"
        onClick={() => {
          props.setJob(undefined);
        }}
      >
        Back to Upload
      </Button>
    </div>
  );
}
