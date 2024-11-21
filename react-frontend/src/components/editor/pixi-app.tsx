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
  // const [app, setApp] = useState<PIXI.Application>();
  const appRef = useRef<PIXI.Application>();

  const srcImg = getImage(props.job.image);
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

  const onMount = async (canvas: HTMLCanvasElement) => {
    if (!isFileWithPreview(props.job.image)) {
      throw new Error(
        `File ${props.job.image.name} does not have a preview property`
      );
    }
    appRef.current = new PIXI.Application();
    await appRef.current.init({
      // application options
      canvas: canvas,
      height: srcImg.height,
      width: srcImg.width
    });
    // do pixi things

    // PIXI.Assets.loadBundle('textures', [{ alias: 'wood', src:  }]);

    const bg = PIXI.Sprite.from(srcImg);
    const maskTexture: PIXI.Texture = await PIXI.Assets.load(maskImgURL);
    const mask = PIXI.Sprite.from(maskTexture);
    mask.width = srcImg.width;
    mask.height = srcImg.height;

    bg.mask = mask;
    appRef.current.stage.addChild(bg, mask);
  };

  const canvasHandler = (canvas: HTMLCanvasElement | null) => {
    (async () => {
      if (canvas) {
        console.debug('initializing app');
        await onMount(canvas);
      } else {
        console.debug('destroying app');
        // console.debug(PIXI.Assets.get('mask'));
        // console.debug(PIXI.Assets.resolver.hasKey('mask'));
        // NOTE: After unload, mask URL remains in resolver and can't be overwritten
        // Small memory leak & could cause a collision if somehow the same mask URL is referenced
        // Not sure how to fix without reload/Assets.reset()
        await PIXI.Assets.unload(maskImgURL);
        // Don't need to unload texture bundle, will be used again if user uploads another image
        appRef.current?.destroy(true, true);
        // console.debug(PIXI.Assets.resolver.hasKey('mask'));
        appRef.current = undefined;
      }
    })().catch((err: unknown) => {
      console.error(err);
    });
  };

  return <canvas id="editor" ref={canvasHandler} />;
}
