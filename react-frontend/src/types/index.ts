interface BaseWallerJob {
  src: File;
}

interface UploadingWallerJob extends BaseWallerJob {
  status: 'uploading';
}

interface UploadedWallerJob extends BaseWallerJob {
  status: 'pending' | 'done';
  id: string;
}

export type CompletedWallerJob = UploadedWallerJob & {
  status: 'done';
  maskURL: string;
};

export type WallerJob =
  | UploadingWallerJob
  | UploadedWallerJob
  | CompletedWallerJob;

export function isJobUploading(job: WallerJob): job is UploadingWallerJob {
  return job.status === 'uploading';
}

export function isJobDone(job: WallerJob): job is CompletedWallerJob {
  return job.status === 'done';
}
