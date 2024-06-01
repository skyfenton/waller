// Based on https://github.com/sadmann7/file-uploader

import * as React from 'react';
import axios, { type AxiosResponse } from 'axios';
// import type { UploadedFile } from "@/types"
// import { toast } from 'sonner';
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
  defaultUploadedFile = undefined
) {
  const [processedFile, setProcessedFile] = React.useState<File | undefined>(
    defaultUploadedFile
  );
  const [progress, setProgress] = React.useState<number | undefined>(undefined);
  const [isUploading, setIsUploading] = React.useState(false);

  async function processFile(file: File) {
    setIsUploading(true);
    try {
      const res = await axios.postForm(
        (import.meta.env.VITE_SERVER_URL as string) + '/upload',
        {
          file: file
        }
      );

      console.log(res);

      setProcessedFile(file);
    } finally {
      setProgress(undefined);
      setIsUploading(false);
    }
  }

  return {
    processedFile,
    progress,
    processFile,
    isUploading
  };
}
