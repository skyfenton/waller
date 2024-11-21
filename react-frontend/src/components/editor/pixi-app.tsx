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

  const onMount = async (view: HTMLCanvasElement) => {
    if (!isFileWithPreview(props.job.image)) {
      return;
    }
    appRef.current = new PIXI.Application();
    await appRef.current.init({
      // application options
      view: view,
      height: srcImg.height,
      width: srcImg.width
    });
    // do pixi things

    appRef.current.renderer.resize(srcImg.width, srcImg.height);

    // PIXI.Assets.loadBundle('textures', [{ alias: 'wood', src:  }]);
    // PIXI.Assets.add({ alias: 'mask', src:  });

    // const srcTexture = new PIXI.Texture(new PIXI.BaseTexture(srcImg));
    const bg = PIXI.Sprite.from(srcImg);
    const maskTexture: PIXI.Texture = await PIXI.Assets.load(maskImgURL);
    const mask = PIXI.Sprite.from(maskTexture);
    mask.width = srcImg.width;
    mask.height = srcImg.height;

    bg.mask = mask;
    appRef.current.stage.addChild(bg, mask);
  };

  const canvasHandler = (canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      console.debug('initializing app');
      onMount(canvas).catch((err: unknown) => {
        console.error(err);
      });
    } else {
      console.debug('destroying app');
      // console.debug(PIXI.Assets.get('mask'));
      // console.debug(PIXI.Assets.resolver.hasKey('mask'));
      // PIXI.Assets.unloadBundle();
      // PIXI.Assets.unload('mask').catch((error: unknown) => {
      //   console.error(error);
      // });
      // PIXI.Assets.reset();
      appRef.current?.destroy(true, true);
      // console.debug(PIXI.Assets);
      appRef.current = undefined;
    }
  };

  return <canvas id="editor" ref={canvasHandler} />;
}
