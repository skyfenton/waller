import { useUploadFile } from '@/hooks/use-upload-file';
import { FileUploader } from './components/file-uploader';

function App() {
  const { uploadFiles, progresses, uploadedFiles, isUploading } = useUploadFile('imageUploader', {
    defaultUploadedFiles: []
  });

  return (
    <div className=" flex min-h-screen flex-col place-content-center ">
      <FileUploader
        maxFiles={1}
        maxSize={2 * 1024 * 1024}
        progresses={progresses}
        onUpload={uploadFiles}
        disabled={isUploading}
      />
    </div>
  );
}

export default App;
