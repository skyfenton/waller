import axios, { AxiosResponse } from 'axios';

import { SingleFileUploader } from '@/components/file-uploader';
import { useRef } from 'react';

interface UploadResponse extends AxiosResponse {
  data: {
    id: string;
  };
}

export default function UploadPage() {
  const abortControllerRef = useRef<AbortController>(new AbortController());

  async function uploadFile(file: File) {
    const res: UploadResponse = await axios.postForm(
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
    await axios.delete(
      (import.meta.env.VITE_SERVER_URL as string) + `/jobs/${id}`,
      {
        signal: AbortSignal.timeout(5000)
      }
    );
  }

  return (
    <>
      <div className=" container flex min-h-screen flex-col place-content-center ">
        <SingleFileUploader onUpload={uploadFile} onCancel={cancelJob} />
      </div>
    </>
  );
}
