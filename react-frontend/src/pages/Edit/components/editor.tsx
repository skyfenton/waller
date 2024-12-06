// import { Stage, Container, Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { useRef } from 'react';
import { WallerJob } from '@/types';
import { getImage, isFileWithPreview } from '@/utils/isFileWithPreview';

interface EditorProps extends React.HTMLAttributes<HTMLCanvasElement> {
  job: WallerJob;
}

export default function Editor(props: EditorProps) {
  const appRef = useRef<PIXI.Application>();

  const srcImg = getImage(props.job.image);
  const maskImgURL =
    (import.meta.env.VITE_SERVER_URL as string) + `/images/${props.job.id}.png`;

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

    // TODO: cleanup warning about not using CanvasSource
    const bg = PIXI.Sprite.from(srcImg);

    const maskTexture: PIXI.Texture = await PIXI.Assets.load(maskImgURL);
    const mask = PIXI.Sprite.from(maskTexture);

    // PIXI.Assets.loadBundle('textures', [{ alias: 'wood', src:  }]);

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

  return <canvas ref={canvasHandler} {...props} />;
}
