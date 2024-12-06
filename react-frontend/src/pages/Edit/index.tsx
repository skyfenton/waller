import { Button } from '@/components/ui/button';
import { isFileWithPreview } from '@/utils/isFileWithPreview';
import { WallerJob } from '@/types';

import Editor from '@/pages/Edit/components/editor';

// TODO: Come up with better name than Edit/Image Page?
export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
}) {
  return (
    <div className="container flex min-h-screen flex-col justify-evenly">
      {isFileWithPreview(props.job.image) ? (
        <Editor id="editor" job={props.job} />
      ) : (
        <h3>Loading...</h3>
      )}
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
