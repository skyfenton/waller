import { useUploadFile } from '@/hooks/use-upload-file';
import { SingleFileUploader } from './components/file-uploader';

function App() {
  const { uploadFile, progress, uploadedFiles, isUploading } = useUploadFile('imageUploader', {
    defaultUploadedFiles: []
  });

  return (
    <div className=" container flex min-h-screen flex-col place-content-center ">
      <SingleFileUploader
        maxSize={2 * 1024 * 1024}
        progress={progress}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onUpload={() => new Promise(() => {})}
        disabled={isUploading}
      />
    </div>
  );
}

export default App;
