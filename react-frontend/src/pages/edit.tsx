import { Button } from '@/components/ui/button';
import { isFileWithPreview } from '@/lib/utils';
import { WallerJob } from '@/types';

import { Stage, Container, Sprite } from '@pixi/react';
import { useEffect, useState, useRef } from 'react';

const useResize = (elementRef: React.RefObject<HTMLElement>) => {
  const [size, setSize] = useState([
    elementRef.current?.clientWidth ?? 1920,
    elementRef.current?.clientHeight ?? 1080
  ]);

  useEffect(() => {
    const onResize = () => {
      requestAnimationFrame(() => {
        if (elementRef.current) {
          setSize([
            elementRef.current.clientWidth,
            elementRef.current.clientHeight
          ]);
        }
      });
    };

    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return size;
};
// TODO: Come up with better name than Edit/Image Page?

export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
}) {
  // const canvasRatio = 3 / 2;
  // const [canvasSize, setCanvasSize] = useState({ width: 100, height: 100 });

  const previewArea = useRef<HTMLDivElement>(null);
  const [width, height] = useResize(previewArea);

  const mask =
    (import.meta.env.VITE_SERVER_URL as string) + `/images/${props.job.id}.png`;

  const getImage = (src: File) => {
    if (isFileWithPreview(src)) {
      const img = new Image();
      img.src = src.preview;
      return img;
    }
  };

  // useEffect(() => {
  //   console.log(previewArea.current);
  // });

  return (
    <div className="container flex min-h-screen flex-col justify-evenly">
      <div ref={previewArea}>
        {isFileWithPreview(props.job.image) ? (
          <Stage
            width={width}
            height={height}
            options={{
              autoDensity: true
              // backgroundAlpha: 0
            }}
          >
            <Container>
              <Sprite image={getImage(props.job.image)} />
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

  // return (
  //   <Stage options={{ background: 0xffffff }}>
  //     <Sprite
  //       image="https://pixijs.io/pixi-react/img/bunny.png"
  //       x={400}
  //       y={270}
  //       anchor={{ x: 0.5, y: 0.5 }}
  //     />

  //     <Container x={400} y={330}>
  //       <Text
  //         text="Hello World"
  //         anchor={{ x: 0.5, y: 0.5 }}
  //         filters={[new BlurFilter()]}
  //       />
  //     </Container>
  //   </Stage>
  // )
}
