import axios from 'axios';

import { SingleFileUploader } from '@/components/file-uploader';
import { useRef } from 'react';

interface UploadData {
  id: string;
}

export default function UploadPage() {
  // Currently continuously polls API, consider using Server-Sent Events to
  // avoid continuously opening a connection
  const abortControllerRef = useRef<AbortController>(new AbortController());

  async function uploadFile(file: File) {
    const res = await axios.postForm<UploadData>(
      (import.meta.env.VITE_SERVER_URL as string) + '/jobs',
      {
        file: file
      },
      {
        signal: abortControllerRef.current.signal
      }
    );

    return res.data.id;
  }

  async function cancelJob(id: string) {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    await axios.delete(
      (import.meta.env.VITE_SERVER_URL as string) + `/jobs/${id}`,
      {
        signal: AbortSignal.timeout(5000)
      }
    );
  }

  return (
    <div className=" container flex min-h-screen flex-col place-content-center ">
      <SingleFileUploader onUpload={uploadFile} onCancel={cancelJob} />
    </div>
  );
}
