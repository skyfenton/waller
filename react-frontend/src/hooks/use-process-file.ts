// Based on https://github.com/sadmann7/file-uploader

import * as React from 'react';
import axios, { type AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';

interface ResponseData extends AxiosResponse {
  data: {
    id: string;
  };
}

export function useUploadFile(defaultUploadedFile = undefined) {
  const [processedFile, setProcessedFile] = React.useState<File | undefined>(
    defaultUploadedFile
  );
  const [progress, setProgress] = React.useState<number | undefined>(undefined);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const navigate = useNavigate();

  async function processFile(file: File) {
    setIsProcessing(true);
    try {
      const res: ResponseData = await axios.postForm(
        (import.meta.env.VITE_SERVER_URL as string) + '/upload',
        {
          file: file
        }
      );

      setProcessedFile(file);

      navigate(`/edit/${res.data.id}`);
    } finally {
      setProgress(undefined);
      setIsProcessing(false);
    }
  }

  return {
    processedFile,
    progress,
    processFile,
    isProcessing
  };
}
