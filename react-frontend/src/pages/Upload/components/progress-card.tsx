import { useEffect, useState } from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';

import { isFileWithPreview } from '@/utils/isFileWithPreview';
import { formatBytes } from '@/utils/formatBytes';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const logError = (err: unknown) => {
  console.error(err);
  if (err instanceof Error) toast.error(err.message);
};

export default function ProgressCard(props: {
  file: File;
  onPoll: () => Promise<number>;
  onCancel: () => Promise<void>;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // TODO: add delay before updating progress to add visual feedback
    setProgress(25);
    let apiTimeout = setTimeout(pollAPI, 1000);
    function pollAPI() {
      props
        .onPoll()
        .then((prog: number) => {
          setProgress(prog);
        })
        .catch((err: unknown) => {
          logError(err);
          props.onCancel().catch(logError);
        });
      apiTimeout = setTimeout(pollAPI, 1000);
    }

    return () => {
      clearTimeout(apiTimeout);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      {isFileWithPreview(props.file) ? (
        <img
          src={props.file.preview}
          alt={props.file.name}
          loading="lazy"
          className="aspect-[2/1] w-auto shrink-0 rounded-md object-cover"
        />
      ) : null}
      <div className="relative flex items-center space-x-4">
        <div className="flex flex-1 space-x-4">
          <div className="flex w-full flex-col gap-2">
            {/* Title, size, and progress */}
            <div className="space-y-px">
              <p className="text-foreground/80 text-md line-clamp-1 font-medium">
                {props.file.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatBytes(props.file.size)}
              </p>
            </div>
            <Progress value={progress} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="cancel-btn"
            type="button"
            variant="outline"
            size="icon"
            className="hover:bg-destructive size-7"
            onClick={() => {
              props.onCancel().catch(logError);
            }}
          >
            <Cross2Icon className="size-4 " aria-hidden="true" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
