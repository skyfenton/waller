// Based on https://github.com/sadmann7/file-uploader

import * as React from 'react';
import axios, { type AxiosResponse } from 'axios';
// import type { UploadedFile } from "@/types"
import { toast } from 'sonner';
// import type { UploadFilesOptions } from "uploadthing/types"

// import { getErrorMessage } from "@/lib/handle-error"
// import { uploadFiles } from "@/lib/uploadthing"
// import { type OurFileRouter } from "@/app/api/uploadthing/core"

// interface UseUploadFileProps
//   extends Pick<
//     UploadFilesOptions<OurFileRouter, keyof OurFileRouter>,
//     "headers" | "onUploadBegin" | "onUploadProgress" | "skipPolling"
//   > {
//   defaultUploadedFiles?: UploadedFile[]
// }

export function useUploadFile(
  // endpoint: keyof OurFileRouter,
  defaultUploadedFiles = []
) {
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>(defaultUploadedFiles);
  const [progresses, setProgresses] = React.useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = React.useState(false);

  // eslint-disable-next-line @typescript-eslint/require-await
  async function uploadFiles(files: File[]) {
    setIsUploading(true);
    try {
      const res = await axios.post(
        (process.env.REACT_APP_SERVER_URL ?? 'NO_ENV') + '/upload',
        { file: file },
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
          // onUploadProgress: props.onUploadProgress,
        }
      );

      setUploadedFiles((prev) => (prev ? [...prev, ...res] : res));
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setProgresses({});
      setIsUploading(false);
    }
  }

  return {
    uploadedFiles,
    progresses,
    uploadFiles: uploadFiles,
    isUploading
  };
}
