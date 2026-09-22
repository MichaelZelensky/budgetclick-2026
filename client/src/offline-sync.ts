import { getState } from "@/state/state";
import { dbGetOfflineSync, dbSaveOfflineSync } from "@/repository/offline-sync";
import { ReferenceDataKey } from "@/types/AppState";
import type { OfflineSync } from "@/types/data/OfflineSync";
import { putFile } from "@/storage";
import { encodeData } from "@/utils/data";
import { manifestKey } from "@/manifest";
import { dbGetChunks } from "@/repository/transaction";
import { dbGetAttachment } from "@/repository/attachment";
import { dbGetStatistics } from "@/repository/statistics";
import { dbGetBalances } from "@/repository/balance";
import { dbGetAccounts } from "@/repository/account";
import { dbGetCategories } from "@/repository/category";
import { dbGetContractors } from "@/repository/contractor";
import { dbGetRates } from "@/repository/rates";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

let synchronizing = false;

const updatePending = async (
  update: (objects: OfflineSync["objects"]) => OfflineSync["objects"],
): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    objects: update(offlineSync.objects),
  });
};

const hasPendingData = (offlineSync: OfflineSync): boolean => {
  return (
    offlineSync.manifest !== null ||
    Object.values(offlineSync.objects.attachments).some(Boolean) ||
    Object.values(offlineSync.objects.chunks).some(Boolean) ||
    offlineSync.objects.accounts ||
    offlineSync.objects.categories ||
    offlineSync.objects.contractors ||
    offlineSync.objects.rates ||
    offlineSync.objects.statistics ||
    offlineSync.objects.balances
  );
};

const getPendingManifest = async () => {
  const offlineSync = await dbGetOfflineSync();
  if (offlineSync.manifest === null) {
    throw new Error("Offline sync manifest not found");
  }
  return offlineSync.manifest;
};

export const initializeOfflineSync = (): void => {
  getState().isOnline = navigator.onLine;
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
};

const handleOnline = (): void => {
  getState().isOnline = true;
  void synchronizeOfflineData();
};

const handleOffline = (): void => {
  getState().isOnline = false;
};

export const setReferenceDataPending = (key: ReferenceDataKey): Promise<void> => {
  return updatePending(objects => ({
    ...objects,
    [key]: true,
  }));
};

export const clearReferenceDataPending = (key: ReferenceDataKey): Promise<void> => {
  return updatePending(objects => ({
    ...objects,
    [key]: false,
  }));
};

export const setAttachmentPending = (id: string): Promise<void> => {
  return updatePending(objects => ({
    ...objects,
    attachments: {
      ...objects.attachments,
      [id]: true,
    },
  }));
};

export const clearAttachmentPending = (id: string): Promise<void> => {
  return updatePending(objects => ({
    ...objects,
    attachments: {
      ...objects.attachments,
      [id]: false,
    },
  }));
};

export const setChunkPending = (key: string): Promise<void> => {
  return updatePending(objects => ({
    ...objects,
    chunks: {
      ...objects.chunks,
      [key]: true,
    },
  }));
};

export const clearChunkPending = (key: string): Promise<void> => {
  return updatePending(objects => ({
    ...objects,
    chunks: {
      ...objects.chunks,
      [key]: false,
    },
  }));
};

export const setObjectPending = (key: "statistics" | "balances", pending: boolean): Promise<void> => {
  return updatePending(objects => ({
    ...objects,
    [key]: pending,
  }));
};

const saveObject = async (objectKey: string, data: unknown): Promise<void> => {
  const manifest = await getPendingManifest();
  console.debug(`Saving object: ${objectKey}`, data);
  await putFile(objectKey, encodeData(data));
  await putFile(manifestKey, encodeData(manifest));
};

const synchronizeReferenceData = async (): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  const manifest = await getPendingManifest();

  const referenceData = {
    accounts: {
      data: await dbGetAccounts(),
      entry: manifest.references.accounts,
    },
    categories: {
      data: await dbGetCategories(),
      entry: manifest.references.categories,
    },
    contractors: {
      data: await dbGetContractors(),
      entry: manifest.references.contractors,
    },
    rates: {
      data: await dbGetRates(),
      entry: manifest.references.rates,
    },
  };

  for (const key of Object.values(ReferenceDataKey)) {
    if (!offlineSync.objects[key]) {
      console.debug(`Skip: ${key}`);
      continue;
    }
    console.debug(`Synchronizing reference data: ${key}`);
    const value = referenceData[key];
    if (value.data === null) {
      throw new Error(`Reference data not found: ${key}`);
    }
    await saveObject(value.entry.objectKey, value.data);
    await clearReferenceDataPending(key);
  }
};

const synchronizeAttachments = async (): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  for (const [id, pending] of Object.entries(offlineSync.objects.attachments)) {
    if (!pending) {
      continue;
    }
    console.debug(`Synchronizing attachment: ${id}`);
    const attachment = await dbGetAttachment(id);
    if (attachment === null) {
      throw new Error(`Attachment not found: ${id}`);
    }
    await putFile(id, encodeData(attachment));
    await clearAttachmentPending(id);
  }
};

const synchronizeChunks = async (): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  const manifest = await getPendingManifest();
  const chunks = await dbGetChunks();

  for (const [month, pending] of Object.entries(offlineSync.objects.chunks)) {
    if (!pending) {
      continue;
    }
    const chunk = chunks[month];
    const entry = manifest.chunks[month];
    if (chunk === undefined || entry === undefined) {
      throw new Error(`Chunk not found: ${month}`);
    }
    await saveObject(entry.objectKey, chunk);
    await clearChunkPending(month);
  }
};

const synchronizeStatistics = async (): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  if (!offlineSync.objects.statistics) {
    return;
  }
  const statistics = await dbGetStatistics();
  if (statistics === null) {
    throw new Error("Statistics not found");
  }
  const manifest = await getPendingManifest();
  await saveObject(manifest.statistics.objectKey, statistics);
  await setObjectPending("statistics", false);
};

const synchronizeBalances = async (): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  if (!offlineSync.objects.balances) {
    return;
  }
  const balances = await dbGetBalances();
  if (balances === null) {
    throw new Error("Balances not found");
  }
  const manifest = await getPendingManifest();
  await saveObject(manifest.balances.objectKey, balances);
  await setObjectPending("balances", false);
};

export const synchronizeOfflineData = async (): Promise<void> => {
  if (!getState().isOnline || synchronizing) {
    return;
  }
  const offlineSync = await dbGetOfflineSync();
  console.log("Offline sync state:", offlineSync);
  if (!hasPendingData(offlineSync)) {
    return;
  }
  synchronizing = true;
  const loadingId = setLoadingOn();
  console.log("Synchronizing offline data... +");
  try {
    await synchronizeReferenceData();
    await synchronizeAttachments();
    await synchronizeChunks();
    await synchronizeStatistics();
    await synchronizeBalances();
    const updatedOfflineSync = await dbGetOfflineSync();
    const hasPendingObjects =
      Object.values(updatedOfflineSync.objects.attachments).some(Boolean) ||
      Object.values(updatedOfflineSync.objects.chunks).some(Boolean) ||
      updatedOfflineSync.objects.accounts ||
      updatedOfflineSync.objects.categories ||
      updatedOfflineSync.objects.contractors ||
      updatedOfflineSync.objects.rates ||
      updatedOfflineSync.objects.statistics ||
      updatedOfflineSync.objects.balances;
    if (!hasPendingObjects && updatedOfflineSync.manifest !== null) {
      await dbSaveOfflineSync({
        ...updatedOfflineSync,
        manifest: null,
      });
    }
  } catch {
    console.error("Error occurred during offline data synchronization. Please check your internet connection and try again.");
  } finally {
    setLoadingOff(loadingId);
    console.log("Offline data synchronization completed.");
    synchronizing = false;
  }
};