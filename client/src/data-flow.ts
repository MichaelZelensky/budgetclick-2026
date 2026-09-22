import { toRaw } from "vue";
import { getState, updateReferenceDataState, updateChunksState } from "@/state/state";
import { getManifest, saveManifest, clearManifestPending, manifestKey } from "@/manifest";
import { getFile, putFile } from "@/storage";
import { dbSaveAccounts } from "@/repository/account";
import { dbSaveCategories } from "@/repository/category";
import { dbSaveContractors } from "@/repository/contractor";
import { dbSaveRates } from "@/repository/rates";
import { dbSaveChunk } from "@/repository/transaction";
import { dbGetAttachment, dbSaveAttachment } from "@/repository/attachment";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import type { CurrencyRatesStorage } from "@/types/storage/CurrencyRatesStorage";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { Attachment } from "@/types/data/Attachment";
import { ReferenceDataKey, ReferenceDataTypes } from "@/types/AppState";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { showError } from "@/state/error";
import { encodeData, decodeData } from "@/utils/data";
import {
  clearAttachmentPending,
  clearChunkPending,
  clearReferenceDataPending,
  setAttachmentPending,
  setChunkPending,
  setReferenceDataPending,
} from "@/offline-sync";

type SaveDataInput<K extends ReferenceDataKey> = {
  key: K;
  data: ReferenceDataTypes[K];
};

type SaveTransactionDataInput = {
  key: string;
  data: ChunkStorage;
};

const toPlain = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(toRaw(data)));
};

const bumpManifest = <T extends Record<string, unknown>>(
  manifest: ReturnType<typeof getManifest>,
  section: "references" | "chunks",
  key: string,
  entry: T,
) => {
  const now = new Date().toISOString();
  return {
    ...manifest,
    version: manifest.version + 1,
    updatedAt: now,
    updatedBy: getState().settings?.clientId ?? "-",
    [section]: {
      ...manifest[section],
      [key]: entry,
    },
  };
};

const updateStorageMetadata = <T extends AccountsStorage | CategoriesStorage | ContractorsStorage | CurrencyRatesStorage>(data: T): T => {
  const now = new Date().toISOString();
  return {
    ...data,
    metadata: {
      ...data.metadata,
      version: data.metadata.version + 1,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
  };
};

const generateObjectKey = (): string => {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Failed to save data";
};

const referenceDataGetters: { [K in ReferenceDataKey]: () => ReferenceDataTypes[K] | null } = {
  [ReferenceDataKey.Accounts]: () => getState().referenceData.accounts,
  [ReferenceDataKey.Categories]: () => getState().referenceData.categories,
  [ReferenceDataKey.Contractors]: () => getState().referenceData.contractors,
  [ReferenceDataKey.Rates]: () => getState().referenceData.rates,
};

const referenceDataSavers: { [K in ReferenceDataKey]: (data: ReferenceDataTypes[K]) => Promise<void> } = {
  [ReferenceDataKey.Accounts]: dbSaveAccounts,
  [ReferenceDataKey.Categories]: dbSaveCategories,
  [ReferenceDataKey.Contractors]: dbSaveContractors,
  [ReferenceDataKey.Rates]: dbSaveRates,
};

export const saveReferenceData = async <K extends ReferenceDataKey>({ key, data }: SaveDataInput<K>): Promise<void> => {
  const loadingId = setLoadingOn();
  try {
    const plainData = toPlain(data);
    const updatedData = updateStorageMetadata(plainData);
    const manifest = getManifest();
    const entry = manifest.references[key];

    if (entry === undefined) {
      throw new Error("Manifest reference not found");
    }

    const dbSave = referenceDataSavers[key];
    await dbSave(updatedData);
    updateReferenceDataState(key, updatedData);
    await setReferenceDataPending(key);
    const updatedManifest = bumpManifest(manifest, "references", key, { ...entry, version: updatedData.metadata.version });
    await saveManifest(updatedManifest);
    await putFile(entry.objectKey, encodeData(updatedData));
    await putFile(manifestKey, encodeData(updatedManifest));
    await clearReferenceDataPending(key);
    await clearManifestPending();
  } catch (error) {
    showError(getErrorMessage(error));
    throw error;
  } finally {
    setLoadingOff(loadingId);
  }
};

export const saveAttachment = async (id: string, data: Attachment): Promise<void> => {
  const loadingId = setLoadingOn();
  try {
    await dbSaveAttachment(id, data);
    await setAttachmentPending(id);
    if (getState().isOnline) {
      try {
        await putFile(id, encodeData(data));
        await clearAttachmentPending(id);
      } catch {
        getState().isOnline = false;
      }
    }
  } catch (error) {
    showError(getErrorMessage(error));
    throw error;
  } finally {
    setLoadingOff(loadingId);
  }
};

export const getAttachment = async (id: string): Promise<Attachment> => {
  const cached = await dbGetAttachment(id);

  if (cached !== null) {
    return cached;
  }

  const data = decodeData<Attachment>(await getFile(id));
  await dbSaveAttachment(id, data);
  return data;
};

export const saveChunkData = async ({ key, data }: SaveTransactionDataInput): Promise<void> => {
  const loadingId = setLoadingOn();
  try {
    const plainData = toPlain(data);
    const now = new Date().toISOString();
    const manifest = getManifest();
    const entry = manifest.chunks[key];
    const objectKey = entry?.objectKey ?? generateObjectKey();
    const updatedData = {
      ...plainData,
      metadata: {
        ...plainData.metadata,
        version: plainData.metadata.version + 1,
        updatedAt: now,
        updatedBy: getState().settings?.clientId ?? "-",
      },
    };

    await dbSaveChunk(key, updatedData);
    updateChunksState(key, updatedData);
    await setChunkPending(key);

    const updatedManifest = bumpManifest(manifest, "chunks", key, { objectKey, version: updatedData.metadata.version });
    await saveManifest(updatedManifest);

    await putFile(objectKey, encodeData(updatedData));
    await clearChunkPending(key);
    await clearManifestPending();
  } catch (error) {
    showError(getErrorMessage(error));
    throw error;
  } finally {
    setLoadingOff(loadingId);
  }
};