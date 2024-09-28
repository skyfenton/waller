import { Button } from '@/components/ui/button';
import { isFileWithPreview } from '@/lib/utils';
import { WallerJob } from '@/types';

import { Stage, Container, Sprite } from '@pixi/react';
import { useEffect, useRef } from 'react';
// TODO: Come up with better name than Edit/Image Page?

export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
}) {
  const previewDiv = useRef<HTMLDivElement>(null);
  const mask =
    (import.meta.env.VITE_SERVER_URL as string) + `/images/${props.job.id}.png`;

  const getImage = (src: File) => {
    if (isFileWithPreview(src)) {
      const img = new Image();
      img.src = src.preview;
      return img;
    }
  };

  return (
    <div className="container flex min-h-screen flex-col justify-evenly">
      <div ref={previewDiv}>
        {isFileWithPreview(props.job.image) ? (
          <Stage
            width={1280}
            height={720}
            options={{
              resizeTo: previewDiv.current as HTMLElement
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
