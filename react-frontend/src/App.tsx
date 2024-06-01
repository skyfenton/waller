import { useUploadFile } from '@/hooks/use-upload-file';
import { SingleFileUploader } from './components/file-uploader';

import { Toaster } from '@/components/ui/sonner';
import { isFileWithPreview } from './lib/utils';
import { useEffect } from 'react';

function App() {
  // TODO refactor useUploadFile to talk to backend (and then replace temp
  // values in component)
  const { processFile, progress, processedFile, isUploading } = useUploadFile();

  useEffect(() => {
    // TODO: consider moving check to a more sensible place?
    if (!import.meta.env.VITE_SERVER_URL) {
      throw new Error('VITE_SERVER_URL is not set');
    }
  }, []);

  return (
    <>
      <div className=" container flex min-h-screen flex-col place-content-center ">
        {processedFile && isFileWithPreview(processedFile) ? (
          <img
            src={processedFile.preview}
            alt={processedFile.name}
            width={200}
            height={200}
          />
        ) : (
          <SingleFileUploader
            maxSize={2 * 1024 * 1024}
            progress={progress}
            onUpload={processFile}
            disabled={isUploading}
          />
        )}
      </div>
      <Toaster />
    </>
  );
}

export default App;
