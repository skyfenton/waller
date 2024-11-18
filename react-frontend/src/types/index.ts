import { ReplaceField } from "@/lib/utils";

export type WallerJob = {
  id: string;
  image: File;
  processed: boolean;
}

export type StoredWallerJob = ReplaceField<WallerJob, 'image', { fileName: string, data: string }>;
