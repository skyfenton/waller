// Based on https://github.com/sadmann7/file-uploader
'use client';

import * as React from 'react';
import { UploadIcon } from '@radix-ui/react-icons';
import Dropzone, {
  type DropzoneProps,
  type FileRejection
} from 'react-dropzone';
import { toast } from 'sonner';

import { cn, formatBytes } from '@/lib/utils';

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value of the uploader.
   * @type File
   * @default undefined
   * @example value={file}
   */
  value?: File;

  /**
   * Function to be called when the value changes.
   * @type React.Dispatch<React.SetStateAction<File | undefined>>
   * @default undefined
   * @example onValueChange={(file) => setFiles(file)}
   */
  onValueChange?: React.Dispatch<React.SetStateAction<File | undefined>>;

  /**
   * Function to be called when a file is uploaded. Function should return a
   * resource id as a string.
   * @type (file: File) => Promise<void>
   * @default undefined
   * @example onUpload={(file) => uploadFile(file)}
   */
  onUpload: (file: File) => Promise<void>;

  // /**
  //  * Function to be called when a file processing job is cancelled.
  //  * @type () => Promise<void>
  //  * @default undefined
  //  * @example onCancel={() => cancelJob()}
  //  */
  // onCancel?: () => Promise<void>;

  /**
   * Progress of the uploaded files.
   * @type number | undefined
   * @default undefined
   * @example progress=50
   */
  progress?: number;

  /**
   * Accepted file types for the uploader.
   * @type { [key: string]: string[]}
   * @default
   * ```ts
   * { "image/*": [] }
   * ```
   * @example accept={["image/png", "image/jpeg"]}
   */
  accept?: DropzoneProps['accept'];

  /**
   * Maximum file size for the uploader.
   * @type number | undefined
   * @default 1024 * 1024 * 2 // 2MB
   * @example maxSize={1024 * 1024 * 2} // 2MB
   */
  maxSize?: DropzoneProps['maxSize'];

  /**
   * Whether the uploader is disabled.
   * @type boolean
   * @default false
   * @example disabled
   */
  disabled?: boolean;
}

export function SingleFileUploader(props: FileUploaderProps) {
  // Unpacks props into consts based on name, remaining passed to Dropzone
  const {
    value: valueProp,
    // onValueChange,
    onUpload,
    // onCancel,
    accept = { 'image/*': [] },
    maxSize = 1024 * 1024 * 2,
    disabled = false,
    className,
    ...dropzoneProps
  } = props;

  // const [file, setFile] = React.useState<File>();

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles.length > 1) {
        toast.error('Cannot upload more than 1 file at a time');
        return;
      }

      // if (file !== undefined) {
      //   toast.error(`A file has already been uploaded`);
      //   return;
      // }

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          toast.error(
            `File '${file.name}' was rejected (${errors
              .map((error) => error.code)
              .join(', ')})`
          );
          console.warn(`File '${file.name}' was rejected`, errors);
        });
      }

      if (acceptedFiles.length > 0) {
        // Only toast on error, otherwise proceed
        onUpload(acceptedFiles[0]).catch((err: unknown) => {
          if (err instanceof Error) {
            console.error(err);
            toast.error(err.message);
          }
        });
      }
    },

    [onUpload]
  );

  // Revoke preview url when component unmounts
  // React.useEffect(() => {
  //   return () => {
  //     if (!file) return;
  //     if (isFileWithPreview(file)) {
  //       URL.revokeObjectURL(file.preview);
  //     }
  //   };
  // }, []);

  // const isDisabled = disabled || uploadedFile !== undefined;

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <Dropzone
        onDrop={onDrop}
        accept={accept}
        maxSize={maxSize}
        multiple={false}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              'group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25',
              'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isDragActive && 'border-muted-foreground/50',
              // isDisabled && 'pointer-events-none opacity-60',
              className
            )}
            {...dropzoneProps}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
              <div className="rounded-full border border-dashed p-3">
                <UploadIcon
                  className="text-muted-foreground size-7"
                  aria-hidden="true"
                />
              </div>
              {isDragActive ? (
                <p className="text-muted-foreground font-medium">
                  Drop the file here
                </p>
              ) : (
                <div className="space-y-px">
                  <p className="text-muted-foreground font-medium">
                    Drag {`'n'`} drop an image here, or click to select an image
                  </p>
                  <p className="text-muted-foreground/70 text-sm">
                    {`You can upload an image with a max size of 
                    ${formatBytes(maxSize)}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Dropzone>
    </div>
  );
}
