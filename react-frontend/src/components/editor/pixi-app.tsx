import { Stage, Container, Sprite } from '@pixi/react';
import { Application, Assets, ImageResource, Texture } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
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
  const [appWidth, setAppWidth] = useState(1);

  const jobImg = getImage(props.job.image);
  const jobImgRatio = jobImg.height / jobImg.width;

  const maskImgURL =
    (import.meta.env.VITE_SERVER_URL as string) + `/images/${props.job.id}.png`;
  // const [maskTex, setMaskTex] = useState<Texture>();
  const maskImgSrc = new ImageResource(maskImgURL);

  // useEffect(() => {
  //   Assets.load(maskImgSrc)
  //     .then(setMaskTex)
  //     .catch((err: unknown) => {
  //       console.error(err);
  //     });
  // }, []);

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
          setAppWidth(w);
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
    <>
      <Stage
        onMount={init}
        onUnmount={() => {
          window.removeEventListener('resize', onResize);
        }}
        options={{
          // backgroundColor: 'white',
          autoDensity: true
        }}
      >
        <Container>
          <Sprite image={jobImg} scale={appWidth / jobImg.width} />
          <Sprite source={maskImgURL} scale={appWidth / maskImgSrc.width} />
        </Container>
      </Stage>
    </>
  );
}
