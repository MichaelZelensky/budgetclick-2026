import { watch } from "vue";
import { getState } from "@/state/state";
import { dbGetOfflineSync, dbSaveOfflineSync } from "@/repository/offline-sync";
import { ReferenceDataKey } from "@/types/AppState";
import type { OfflineSync } from "@/types/data/OfflineSync";
import { headRawFile, putFile } from "@/storage";
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
import { dbGetRecurrences } from "@/repository/recurrence";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { logger } from "@/logger";

let synchronizing = false;
let probing = false;
let listenersRegistered = false;
let probeTimer: number | null = null;

const PROBE_MIN_DELAY_MS = 30_000;
const PROBE_MAX_DELAY_MS = 300_000;

let probeDelay = PROBE_MIN_DELAY_MS;

const updatePending = async (
  update: (objects: OfflineSync["objects"]) => OfflineSync["objects"],
): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    objects: update(offlineSync.objects),
  });
};

const hasPendingObject = (offlineSync: OfflineSync): boolean => {
  return (
    Object.values(offlineSync.objects.attachments).some(Boolean) ||
    Object.values(offlineSync.objects.chunks).some(Boolean) ||
    offlineSync.objects.accounts ||
    offlineSync.objects.categories ||
    offlineSync.objects.contractors ||
    offlineSync.objects.rates ||
    offlineSync.objects.recurrences ||
    offlineSync.objects.statistics ||
    offlineSync.objects.balances
  );
};

const hasPendingData = (offlineSync: OfflineSync): boolean => {
  return offlineSync.manifest !== null || hasPendingObject(offlineSync);
};

const getPendingManifest = async () => {
  const offlineSync = await dbGetOfflineSync();
  if (offlineSync.manifest === null) {
    throw new Error("Offline sync manifest not found");
  }
  return offlineSync.manifest;
};

const isPageVisible = (): boolean => {
  return document.visibilityState === "visible";
};

const clearProbeTimer = (): void => {
  if (probeTimer !== null) {
    window.clearTimeout(probeTimer);
    probeTimer = null;
  }
};

const scheduleProbe = (): void => {
  if (probeTimer !== null || getState().isOnline || !isPageVisible()) {
    return;
  }
  probeTimer = window.setTimeout(() => {
    probeTimer = null;
    void probeStorage();
  }, probeDelay);
};

const probeStorage = async (): Promise<void> => {
  if (getState().isOnline || probing) {
    return;
  }
  clearProbeTimer();
  probing = true;
  try {
    await headRawFile(manifestKey);
    probeDelay = PROBE_MIN_DELAY_MS;
    if (getState().isOnline) {
      await synchronizeOfflineData();
    }
  } catch {
    // Still unreachable; storage.ts keeps isOnline false.
    probeDelay = Math.min(probeDelay * 2, PROBE_MAX_DELAY_MS);
  } finally {
    probing = false;
    scheduleProbe();
  }
};

export const initializeOfflineSync = (): void => {
  getState().isOnline = navigator.onLine;
  if (listenersRegistered) {
    return;
  }
  listenersRegistered = true;
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  watch(
    () => getState().isOnline,
    (isOnline) => {
      if (isOnline) {
        clearProbeTimer();
        probeDelay = PROBE_MIN_DELAY_MS;
      } else {
        scheduleProbe();
      }
    },
  );
  scheduleProbe();
};

const handleOnline = (): void => {
  probeDelay = PROBE_MIN_DELAY_MS;
  void probeStorage();
};

const handleOffline = (): void => {
  getState().isOnline = false;
};

const handleVisibilityChange = (): void => {
  if (isPageVisible()) {
    probeDelay = PROBE_MIN_DELAY_MS;
    void probeStorage();
  } else {
    clearProbeTimer();
  }
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
  logger.debug(`Saving object: ${objectKey}`, data);
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
    recurrences: {
      data: await dbGetRecurrences(),
      entry: manifest.references.recurrences,
    },
  };

  for (const key of Object.values(ReferenceDataKey)) {
    if (!offlineSync.objects[key]) {
      logger.debug(`Skip: ${key}`);
      continue;
    }
    logger.debug(`Synchronizing reference data: ${key}`);
    const value = referenceData[key];
    if (value.data === null) {
      throw new Error(`Reference data not found: ${key}`);
    }
    try {
      await saveObject(value.entry.objectKey, value.data);
      await clearReferenceDataPending(key);
    } catch (error) {
      logger.error(`Failed to synchronize reference data: ${key}`, error);
    }
  }
};

const synchronizeAttachments = async (): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  for (const [id, pending] of Object.entries(offlineSync.objects.attachments)) {
    if (!pending) {
      continue;
    }
    logger.debug(`Synchronizing attachment: ${id}`);
    try {
      const attachment = await dbGetAttachment(id);
      if (attachment === null) {
        throw new Error(`Attachment not found: ${id}`);
      }
      await putFile(id, encodeData(attachment));
      await clearAttachmentPending(id);
    } catch (error) {
      logger.error(`Failed to synchronize attachment: ${id}`, error);
    }
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
    try {
      await saveObject(entry.objectKey, chunk);
      await clearChunkPending(month);
    } catch (error) {
      logger.error(`Failed to synchronize chunk: ${month}`, error);
    }
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
  try {
    await saveObject(manifest.statistics.objectKey, statistics);
    await setObjectPending("statistics", false);
  } catch (error) {
    logger.error("Failed to synchronize statistics", error);
  }
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
  try {
    await saveObject(manifest.balances.objectKey, balances);
    await setObjectPending("balances", false);
  } catch (error) {
    logger.error("Failed to synchronize balances", error);
  }
};

export const synchronizeOfflineData = async (): Promise<void> => {
  if (!getState().isOnline || synchronizing) {
    return;
  }
  const offlineSync = await dbGetOfflineSync();
  logger.info("Offline sync state:", offlineSync);
  if (!hasPendingData(offlineSync)) {
    return;
  }
  synchronizing = true;
  const loadingId = setLoadingOn();
  logger.info("Synchronizing offline data... +");
  try {
    await synchronizeReferenceData();
    await synchronizeAttachments();
    await synchronizeChunks();
    await synchronizeStatistics();
    await synchronizeBalances();
    const updatedOfflineSync = await dbGetOfflineSync();
    if (!hasPendingObject(updatedOfflineSync) && updatedOfflineSync.manifest !== null) {
      await dbSaveOfflineSync({
        ...updatedOfflineSync,
        manifest: null,
      });
    }
  } catch {
    logger.error("Error occurred during offline data synchronization. Please check your internet connection and try again.");
  } finally {
    setLoadingOff(loadingId);
    logger.info("Offline data synchronization completed.");
    synchronizing = false;
  }
};