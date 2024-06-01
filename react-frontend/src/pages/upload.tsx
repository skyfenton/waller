import { SingleFileUploader } from '@/components/file-uploader';
import { useUploadFile } from '@/hooks/use-upload-file';
import { isFileWithPreview } from '@/lib/utils';

export default function UploadPage() {
  const { processFile, progress, processedFile, isUploading } = useUploadFile();

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
    </>
  );
}
