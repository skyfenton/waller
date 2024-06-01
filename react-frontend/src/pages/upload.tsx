import { SingleFileUploader } from '@/components/file-uploader';
import { useUploadFile } from '@/hooks/use-process-file';

export default function UploadPage() {
  const { processFile, progress, processedFile, isProcessing } =
    useUploadFile();

  return (
    <>
      <div className=" container flex min-h-screen flex-col place-content-center ">
        <SingleFileUploader
          maxSize={2 * 1024 * 1024}
          progress={progress}
          onUpload={processFile}
          disabled={isProcessing}
        />
      </div>
    </>
  );
}
