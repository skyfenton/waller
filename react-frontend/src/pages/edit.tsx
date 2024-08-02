import { Button } from '@/components/ui/button';
import { WallerJob } from '@/types';
import { Link } from 'react-router-dom';
// TODO: Come up with better name than Edit/Image Page?

export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
  setIsEditing: (isEditing: boolean) => void;
}) {
  // TODO: Get image mask before editing

  return (
    <div className="container min-h-screen">
      <Button
        variant="destructive"
        onClick={() => {
          props.setJob(undefined);
          props.setIsEditing(false);
        }}
      >
        Back to Upload
      </Button>
      {props.job.id}
    </div>
  );
}
