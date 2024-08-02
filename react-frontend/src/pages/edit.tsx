import { Button } from '@/components/ui/button';
import { WallerJob } from '@/types';
// TODO: Come up with better name than Edit/Image Page?

export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
  setIsEditing: (isEditing: boolean) => void;
}) {
  // TODO: Get image mask before editing

  return (
    <div className="container flex min-h-screen flex-col">
      <Button
        variant="destructive"
        onClick={() => {
          props.setJob(undefined);
          props.setIsEditing(false);
        }}
      >
        Back to Upload
      </Button>
      <p>id: {props.job.id}</p>
      <div id="preview">
        <img
          src={
            (import.meta.env.VITE_SERVER_URL as string) +
            `/images/${props.job.id}.png`
          }
          className=""
          alt={`Mask for ${props.job.image.name}`}
        />
      </div>
    </div>
  );
}
