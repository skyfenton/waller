import { Stage, Container, Sprite, AppConsumer, withPixiApp, AppProvider, useApp } from '@pixi/react';
import { Application, Color, ICanvas, Sprite as SpriteObj } from 'pixi.js';
import { useRef } from 'react';
import { WallerJob } from '@/types';
import { isFileWithPreview } from '@/lib/utils';

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

export default function Editor(props: {job: WallerJob, imageBoundContainer: React.RefObject<HTMLDivElement>}) {
  const appRef = useRef<Application<ICanvas>>();

  const onResize = () => {
      if (!appRef.current!.resizeTo && props.imageBoundContainer.current !== null) {
        appRef.current!.resizeTo = props.imageBoundContainer.current;
      }
      appRef.current!.queueResize();
  };

  const init = (app: Application<ICanvas>) => {
    console.debug("Initializing pixijs app");
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
        backgroundColor: 'white', 
        autoDensity: true,
        resizeTo: undefined,
      }}
    >
      <Container>
        {/* <Rectangle
          x={0}
          y={0}
          width={100}
          height={100}
          color="white"
          zIndex={0}
        /> */}
      </Container>
    </Stage>
  )
}