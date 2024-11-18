import { Stage, Container, Sprite } from '@pixi/react';
import { Application, ICanvas, Sprite as SpriteObj } from 'pixi.js';
import { useRef, useState } from 'react';
import { WallerJob } from '@/types';
import { isFileWithPreview } from '@/lib/utils';

/**
 * Given a file, returns an image element from the file's preview.
 * Throws an error if the file does not have a preview property.
 * @param src The file to get the image from.
 * @returns An image element.
 * @throws If the file does not have a preview property.
 */
function getImage(src: File): HTMLImageElement {
  if (isFileWithPreview(src)) {
    const img = new Image();
    img.src = src.preview;
    return img;
  } else {
    throw new Error(`File ${src.name} does not have a preview property`);
  }
}

export default function Editor(props: {
  job: WallerJob;
  imageBoundContainer: React.RefObject<HTMLDivElement>;
}) {
  const appRef = useRef<Application>();
  const animIdRef = useRef<number>();

  const jobImg = getImage(props.job.image);
  const jobImgRatio = jobImg.height / jobImg.width;
  const [scale, setScale] = useState(1);

  // Consolidate resizing functions
  const cancelResize = () => {
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = undefined;
    }
  };

  const onResize = () => {
    cancelResize();
    animIdRef.current = requestAnimationFrame(() => {
      cancelResize();
      if (props.imageBoundContainer.current) {
        const w = props.imageBoundContainer.current.clientWidth;
        if (appRef.current) {
          // state triggers (full canvas?) rerender, may be able to increase performance here
          setScale(w / jobImg.width);
          appRef.current.renderer.resize(w, w * jobImgRatio);
          appRef.current.render();
        }
      }
    });
  };

  const init = (app: Application) => {
    console.debug('Initializing pixijs app...');
    appRef.current = app;
    onResize();
    window.addEventListener('resize', onResize);
  };

  return (
    <Stage
      onMount={init}
      onUnmount={() => {
        window.removeEventListener('resize', onResize);
      }}
      options={{
        // backgroundColor: 'white',
        autoDensity: true,
        resizeTo: undefined
      }}
    >
      <Container>
        <Sprite image={jobImg} scale={scale} />
      </Container>
    </Stage>
  );
}
