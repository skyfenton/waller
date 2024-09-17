import { Button } from '@/components/ui/button';
import { isFileWithPreview } from '@/lib/utils';
import { WallerJob } from '@/types';
// TODO: Come up with better name than Edit/Image Page?

export default function EditPage(props: {
  job: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
  setIsEditing: (isEditing: boolean) => void;
}) {
  // TODO: Get image mask before editing
  const mask =
    (import.meta.env.VITE_SERVER_URL as string) + `/images/${props.job.id}.png`;
  // const mask = (import.meta.env.VITE_SERVER_URL as string) + '/images/star.png';

  return (
    <div className="container flex min-h-screen flex-col justify-evenly">
      <div id="preview">
        {isFileWithPreview(props.job.image) ? (
          <img
            src={props.job.image.preview}
            alt={props.job.image.name}
            loading="lazy"
            className="w-auto shrink-0 object-cover"
            style={{
              maskImage: `url(${mask})`,
              WebkitMaskImage: `url(${mask})`,
              maskSize: 'cover'
            }}
          />
        ) : (
          <h3>Loading picture...</h3>
        )}
      </div>
      <p>id: {props.job.id}</p>
      <Button
        variant="destructive"
        onClick={() => {
          props.setJob(undefined);
          props.setIsEditing(false);
        }}
      >
        Back to Upload
      </Button>
    </div>
  );
}
