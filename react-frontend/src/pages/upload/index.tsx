import axios from 'axios';

import { SingleFileUploader } from '@/pages/upload/components/file-uploader';
import { useCallback, useRef, useState } from 'react';
import { CompletedWallerJob, WallerJob, isJobUploading } from '@/types';
import { isFileWithPreview } from '@/utils/isFileWithPreview';
import { formatBytes } from '@/utils/formatBytes';
import ProgressCard from './components/progress-card';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB, mirrors backend limit
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

interface UploadData {
  id: number;
}

interface JobData {
  status: string;
}

interface CompletedJobData extends JobData {
  status: 'done';
  maskURL: string;
}

/**
 * Extract a user-facing error message, preferring the backend's error detail
 * (e.g. "File too large") over axios' generic "Request failed..." message.
 */
function getRequestErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: unknown } | undefined)
      ?.detail;
    return typeof detail === 'string' ? detail : err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

export default function UploadPage(props: {
  job?: WallerJob;
  setJob: (job: WallerJob | undefined) => void;
}) {
  // NOTE: Currently continuously polls API, consider using Server-Sent Events
  // to avoid continuously opening a connection
  const abortControllerRef = useRef<AbortController>(new AbortController());
  // Upload transfer progress (0-100); undefined when no upload is in flight
  const [uploadProgress, setUploadProgress] = useState<number>();

  async function uploadImage(file: File) {
    // react-dropzone already enforces these, but guard direct calls as well
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `File too large: must be under ${formatBytes(MAX_UPLOAD_BYTES)}`
      );
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type: must be a JPEG or PNG image');
    }

    Object.assign(file, {
      preview: URL.createObjectURL(file)
    });

    props.setJob({ src: file, status: 'uploading' });
    setUploadProgress(0);

    // The backend expects multipart/form-data with the file in a 'file'
    // field. Don't set Content-Type manually so the browser can add the
    // multipart boundary.
    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const res = await axios.post<UploadData>(
        (import.meta.env.VITE_SERVER_URL as string) + '/jobs',
        formData,
        {
          signal: abortControllerRef.current.signal,
          onUploadProgress: (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total));
            }
          }
        }
      );

      props.setJob({ id: res.data.id, src: file, status: 'pending' });
    } catch (err) {
      // Clean up failed or cancelled uploads so the user can retry
      if (isFileWithPreview(file)) {
        URL.revokeObjectURL(file.preview);
      }
      props.setJob(undefined);
      // Cancellation is expected; don't surface it as an error
      if (axios.isCancel(err)) return;
      throw new Error(getRequestErrorMessage(err));
    } finally {
      setUploadProgress(undefined);
    }
  }

  const getJobProgress = useCallback(async (): Promise<number> => {
    if (props.job) {
      // No id in system (still uploading)
      if (isJobUploading(props.job)) return 25;

      // Has id in system (poll for status)
      console.debug('polling id:', props.job.id);

      return await axios
        .get<JobData>(
          (import.meta.env.VITE_SERVER_URL as string) +
            `/jobs/${String(props.job.id)}`
        )
        .then((res) => {
          switch (res.data.status) {
            case 'queued':
              return 50;
            case 'processing':
              return 75;
            case 'done': {
              props.setJob({
                ...props.job,
                status: 'done',
                maskURL: (res.data as CompletedJobData).maskURL
              } as CompletedWallerJob);
              return 100;
            }
            // Get file from presigned URL
            default:
              throw new Error('Unknown job status: ' + res.data.status);
          }
        });
    }
    return 0;
  }, [props.job, props.setJob]);

  async function cancelJob() {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    if (props.job && 'id' in props.job) {
      await axios.delete(
        (import.meta.env.VITE_SERVER_URL as string) +
          `/jobs/${String(props.job.id)}`,
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
            uploadProgress={uploadProgress}
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
