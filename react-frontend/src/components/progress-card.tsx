import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cross2Icon } from '@radix-ui/react-icons';

import axios from 'axios';

import { formatBytes, isFileWithPreview } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface JobData {
  status: string;
}

export default function ProgressCard(props: {
  file: File;
  id: string;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: poll while uploading for progress accuracy?
    // TODO: add delay before updating progress to add visual feedback
    setProgress(25);
    let apiTimeout = setTimeout(pollAPI, 1000);
    function pollAPI() {
      // TODO: Update uploading
      if (props.id !== '') {
        console.log('polling', props.id);
        axios
          .get<JobData>(
            (import.meta.env.VITE_SERVER_URL as string) + `/jobs/${props.id}`
          )
          .then((res) => {
            switch (res.data.status) {
              case 'uploading':
                setProgress(25);
                break;
              case 'queued':
                setProgress(50);
                break;
              case 'processing':
                setProgress(75);
                break;
              case 'done':
                setProgress(100);
                navigate(`/edit/${props.id}`);
                break;
            }
          })
          .catch((err: unknown) => {
            console.error(err);
            if (err instanceof Error) toast.error(err.message);
            props.onCancel();
          });
      }
      apiTimeout = setTimeout(pollAPI, 1000);
    }

    return () => {
      clearTimeout(apiTimeout);
    };
  }, [props.id]);

  return (
    <div className="flex flex-col space-y-4">
      {isFileWithPreview(props.file) ? (
        <img
          src={props.file.preview}
          alt={props.file.name}
          loading="lazy"
          className="aspect-[4/2] w-auto shrink-0 rounded-md object-cover"
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
          {/* Cancel button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hover:bg-destructive size-7"
            onClick={props.onCancel}
          >
            <Cross2Icon className="size-4 " aria-hidden="true" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
