// import { Stage, Container, Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { useRef } from 'react';
import { CompletedWallerJob } from '@/types';
import { getImage } from '@/utils/isFileWithPreview';

interface EditorProps extends React.HTMLAttributes<HTMLCanvasElement> {
  job: CompletedWallerJob;
}

export default function Editor(props: EditorProps) {
  const appRef = useRef<PIXI.Application>();

  const srcImg = getImage(props.job.src);

  const renderApp = async (canvas: HTMLCanvasElement) => {
    appRef.current = new PIXI.Application();
    await appRef.current.init({
      // application options
      canvas: canvas,
      height: srcImg.height,
      width: srcImg.width
    });

    // TODO: cleanup warning about not using CanvasSource
    const bg = PIXI.Sprite.from(srcImg);

    const maskTexture: PIXI.Texture = await PIXI.Assets.load(props.job.maskURL);
    const mask = PIXI.Sprite.from(maskTexture);

    const textureBundle = [
      {
        alias: 'wood',
        src: 'https://images.pexels.com/photos/326333/pexels-photo-326333.jpeg'
      }
    ];

    PIXI.Assets.addBundle('textures', textureBundle);
    await PIXI.Assets.loadBundle('textures');

    const woodBg = PIXI.Sprite.from('wood');
    woodBg.width = srcImg.width;
    woodBg.height = srcImg.height;
    woodBg.zIndex = -1;

    mask.width = srcImg.width;
    mask.height = srcImg.height;

    bg.mask = mask;
    appRef.current.stage.addChild(bg, mask, woodBg);
  };

  const canvasHandler = (canvas: HTMLCanvasElement | null) => {
    (async () => {
      if (canvas) {
        console.debug('initializing app');
        await renderApp(canvas);
      } else {
        console.debug('destroying app');
        // console.debug(PIXI.Assets.get('mask'));
        // console.debug(PIXI.Assets.resolver.hasKey('mask'));
        // NOTE: After unload, mask URL remains in resolver and can't be overwritten
        // Small memory leak & could cause a collision if somehow the same mask URL is referenced
        // Not sure how to fix without reload/Assets.reset()
        await PIXI.Assets.unload(props.job.maskURL);
        // Don't need to unload texture bundle, will be used again if user uploads another image
        appRef.current?.destroy(true, true);
        // console.debug(PIXI.Assets.resolver.hasKey('mask'));
        appRef.current = undefined;
      }
    })().catch((err: unknown) => {
      console.error(err);
    });
  };

  return <canvas ref={canvasHandler} {...props} />;
}
