interface BaseWallerJob {
  src: File;
}

export interface UploadingWallerJob extends BaseWallerJob {
  status: 'uploading';
}

export interface UploadedWallerJob extends BaseWallerJob {
  status: 'pending' | 'done';
  id: string;
}

export type WallerJob = UploadingWallerJob | UploadedWallerJob;

export function isJobUploading(job: WallerJob): job is UploadingWallerJob {
  return job.status === 'uploading';
}

export function isJobDone(job: WallerJob): job is UploadedWallerJob {
  return job.status === 'done';
}
