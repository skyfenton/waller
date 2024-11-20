import { Button } from '@/components/ui/button';
import { isFileWithPreview } from '@/lib/utils';
import { WallerJob } from '@/types';

import { useRef } from 'react';

import Editor from '@/components/editor/pixi-app';

// TODO: Come up with better name than Edit/Image Page?
export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
}) {
  const previewArea = useRef<HTMLDivElement>(null);
  return (
    <div className="container flex min-h-screen flex-col justify-evenly">
      {/* <div ref={previewArea}> */}
      {isFileWithPreview(props.job.image) ? (
        <Editor job={props.job} imageBoundContainer={previewArea} />
      ) : (
        <h3>Loading picture...</h3>
      )}
      {/* </div> */}
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
}
