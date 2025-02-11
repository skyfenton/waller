import axios from 'axios';

import { SingleFileUploader } from '@/pages/upload/components/file-uploader';
import { useRef } from 'react';
import { WallerJob } from '@/types';
import { isFileWithPreview } from '@/utils/isFileWithPreview';
import ProgressCard from './components/progress-card';

interface UploadData {
  id: string;
}

interface JobData {
  status: string;
}

export default function UploadPage(props: {
  job?: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
}) {
  // NOTE: Currently continuously polls API, consider using Server-Sent Events
  // to avoid continuously opening a connection
  const abortControllerRef = useRef<AbortController>(new AbortController());

  async function uploadImage(file: File) {
    Object.assign(file, {
      preview: URL.createObjectURL(file)
    });
    console.log(file);

    props.setJob({ id: undefined, image: file, processed: false });

    const res = await axios.post<UploadData>(
      (import.meta.env.VITE_SERVER_URL as string) + '/jobs',
      await file.arrayBuffer(),
      {
        headers: {
          'Content-Type': file.type
        },
        signal: abortControllerRef.current.signal
      }
    );

    props.setJob({ id: res.data.id, image: file, processed: false });
  }

  async function getJobProgress(): Promise<number> {
    if (props.job) {
      console.debug('polling id:', props.job.id);

      // No id in system (still uploading)
      if (!props.job.id) return 25;

      // Has id in system (poll for status)
      return await axios
        .get<JobData>(
          (import.meta.env.VITE_SERVER_URL as string) + `/jobs/${props.job.id}`
        )
        .then((res) => {
          switch (res.data.status) {
            case 'queued':
              return 50;
            case 'processing':
              return 75;
            case 'done':
              props.setJob({ ...props.job, processed: true } as WallerJob);
              return 100;
            default:
              throw new Error('Unknown job status: ' + res.data.status);
          }
        });
    }
    return 0;
  }

  async function cancelJob() {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    if (props.job?.id) {
      await axios.delete(
        (import.meta.env.VITE_SERVER_URL as string) + `/jobs/${props.job.id}`,
        {
          signal: AbortSignal.timeout(5000)
        }
      );

      if (isFileWithPreview(props.job.image)) {
        URL.revokeObjectURL(props.job.image.preview);
      }

      props.setJob(undefined);
    }
  }

  return (
    <div className="container flex min-h-screen flex-col place-content-center">
      {props.job ? (
        <div className="mx-auto w-full max-w-2xl">
          <ProgressCard
            image={props.job.image}
            onPoll={getJobProgress}
            onCancel={cancelJob}
          />
        </div>
      ) : (
        <SingleFileUploader onUpload={uploadImage} />
      )}
    </div>
  );
}
