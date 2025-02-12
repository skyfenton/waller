import axios from 'axios';

import { SingleFileUploader } from '@/pages/upload/components/file-uploader';
import { useRef } from 'react';
import { UploadedWallerJob, WallerJob, isJobUploading } from '@/types';
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

    props.setJob({ src: file, status: 'uploading' });

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

    props.setJob({ id: res.data.id, src: file, status: 'pending' });
  }

  async function getJobProgress(): Promise<number> {
    if (props.job) {
      // No id in system (still uploading)
      if (isJobUploading(props.job)) return 25;

      // Has id in system (poll for status)
      console.debug('polling id:', props.job.id);

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
              props.setJob({
                ...props.job,
                status: 'done'
              } as UploadedWallerJob);
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
    if (props.job && 'id' in props.job) {
      await axios.delete(
        (import.meta.env.VITE_SERVER_URL as string) + `/jobs/${props.job.id}`,
        {
          signal: AbortSignal.timeout(5000)
        }
      );

      if (isFileWithPreview(props.job.src)) {
        URL.revokeObjectURL(props.job.src.preview);
      }

      props.setJob(undefined);
    }
  }

  return (
    <div className="container flex min-h-screen flex-col place-content-center">
      {props.job ? (
        <div className="mx-auto w-full max-w-2xl">
          <ProgressCard
            image={props.job.src}
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
