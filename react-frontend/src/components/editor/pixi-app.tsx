// import { Stage, Container, Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';
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
  // const animIdRef = useRef<number>();
  // const [appWidth, setAppWidth] = useState(0);

  // const jobImgRatio = jobImg.height / jobImg.width;

  const maskImgURL =
    (import.meta.env.VITE_SERVER_URL as string) + `/images/${props.job.id}.png`;
  // TODO: find better way to read width of url (load asset to draw?)
  // const maskImgSrc = new ImageResource(maskImgURL);

  // TODO: Consolidate resizing functions
  // const cancelResize = () => {
  //   if (animIdRef.current) {
  //     cancelAnimationFrame(animIdRef.current);
  //     animIdRef.current = undefined;
  //   }
  // };

  // const onResize = () => {
  //   cancelResize();
  //   animIdRef.current = requestAnimationFrame(() => {
  //     cancelResize();
  //     if (props.imageBoundContainer.current) {
  //       const w = props.imageBoundContainer.current.clientWidth;
  //       if (appRef.current) {
  //         // NOTE: state triggers slow rerender, violates raf handler time
  //         // TODO: need to modify to avoid slow sprite resizing
  //         setAppWidth(w);
  //         appRef.current.renderer.resize(w, w * jobImgRatio);
  //         appRef.current.render();
  //       }
  //     }
  //   });
  // };

  const init = (canvas: HTMLCanvasElement) => {
    const app = new PIXI.Application({
      view: canvas,
      backgroundColor: 'red'
    });

    if (!isFileWithPreview(props.job.image)) {
      return;
    }

    const srcImg = getImage(props.job.image);
    const srcTexture = new PIXI.Texture(new PIXI.BaseTexture(srcImg));
    PIXI.Assets.add({ alias: 'mask', src: maskImgURL });

    const texturesPromise = PIXI.Assets.load(['mask']);

    texturesPromise
      .then((textures: Record<string, PIXI.SpriteSource>) => {
        // console.debug(textures);
        const bg = PIXI.Sprite.from(srcTexture);
        const mask = PIXI.Sprite.from(textures.mask);

        bg.mask = mask;
        app.stage.addChild(bg);
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  };

  return <canvas id="editor" ref={init} />;
}
