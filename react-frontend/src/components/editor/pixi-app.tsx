import { Stage, Container, Sprite, useApp } from '@pixi/react';
import { Container as ContainerObj } from 'pixi.js';
import Rectangle from '@/components/editor/rectangle';
import { useEffect } from 'react';
import { WallerJob } from '@/types';
import { isFileWithPreview } from '@/lib/utils';
import { useResize } from '@/hooks/use-resize';

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

export default function PixiApp(props: {
  job: WallerJob;
  imageBoundContainer: React.RefObject<HTMLDivElement>;
}) {
  // const app = useApp();
  //   console.log(app.stage.children);

  //   useEffect(() => {
  //     app.stage.removeChildren();
  //     const container = new ContainerObj();
  //     app.stage.addChild(container);
  //   }, [app]);

  const jobImg = getImage(props.job.image);
  const [width, height] = useResize(
    props.imageBoundContainer,
    jobImg.width / jobImg.height
  );

  return (
    <Stage
      width={width}
      height={height}
      options={{
        autoDensity: true
      }}
    >
      <Container width={width} height={height} sortableChildren={true}>
        {/* <Sprite
          width={width}
          height={height}
          image={jobImg}
          zIndex={1}
          source={maskImgSrc}
        /> */}
        <Rectangle
          x={0}
          y={0}
          width={width}
          height={height}
          color="blue"
          zIndex={0}
        />
      </Container>
    </Stage>
  );
}
