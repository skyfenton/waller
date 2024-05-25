import { useUploadFile } from '@/hooks/use-upload-file';
import { SingleFileUploader } from './components/file-uploader';

function App() {
  // TODO refactor useUploadFile to talk to backend (and then replace temp
  // values in component)
  const { uploadFile, progress, uploadedFiles, isUploading } = useUploadFile('imageUploader', {
    defaultUploadedFiles: []
  });

  return (
    <div className=" container flex min-h-screen flex-col place-content-center ">
      <SingleFileUploader
        maxSize={2 * 1024 * 1024}
        progress={50}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onUpload={() => new Promise(() => {})}
        disabled={isUploading}
      />
    </div>
  );
}

export default App;
