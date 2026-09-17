import { dbGetOfflineSync, dbSaveOfflineSync } from "@/repository/offline-sync";
import { ReferenceDataKey } from "@/types/AppState";

export const setReferenceDataPending = async (key: ReferenceDataKey): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    objects: {
      ...offlineSync.objects,
      [key]: true,
    },
  });
};

export const setChunkPending = async (key: string): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    objects: {
      ...offlineSync.objects,
      chunks: {
        ...offlineSync.objects.chunks,
        [key]: true,
      },
    },
  });
};

export const clearReferenceDataPending = async (key: ReferenceDataKey): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    objects: {
      ...offlineSync.objects,
      [key]: false,
    },
  });
};

export const clearChunkPending = async (key: string): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    objects: {
      ...offlineSync.objects,
      chunks: {
        ...offlineSync.objects.chunks,
        [key]: false,
      },
    },
  });
};