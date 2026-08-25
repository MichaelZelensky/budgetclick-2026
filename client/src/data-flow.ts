import { toRaw } from "vue";
import { getState, updateReferenceDataState, updateChunksState } from "@/state/state";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { dbSaveAccounts } from "@/repository/account";
import { dbSaveCategories } from "@/repository/category";
import { dbSaveContractors } from "@/repository/contractor";
import { dbSaveChunk, dbDeleteChunk } from "@/repository/transaction";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import { ReferenceDataKey, ReferenceDataTypes } from "@/types/AppState";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { showError } from "@/state/error";

type SaveDataInput<K extends ReferenceDataKey> = {
  key: K;
  data: ReferenceDataTypes[K];
};

type SaveTransactionDataInput = {
  key: string;
  data: ChunkStorage;
};

const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
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

const updateStorageMetadata = <T extends AccountsStorage | CategoriesStorage | ContractorsStorage>(data: T): T => {
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
};

const referenceDataSavers: { [K in ReferenceDataKey]: (data: ReferenceDataTypes[K]) => Promise<void> } = {
  [ReferenceDataKey.Accounts]: dbSaveAccounts,
  [ReferenceDataKey.Categories]: dbSaveCategories,
  [ReferenceDataKey.Contractors]: dbSaveContractors,
};

export const saveReferenceData = async <K extends ReferenceDataKey>({ key, data }: SaveDataInput<K>): Promise<void> => {
  const loadingId = setLoadingOn();
  const previousData = referenceDataGetters[key]();
  const plainPreviousData = previousData === null ? null : toPlain(previousData);

  try {
    const plainData = toPlain(data);
    const updatedData = updateStorageMetadata(plainData);
    const manifest = getManifest();
    const entry = manifest.references[key];

    if (entry === undefined) {
      throw new Error("Manifest reference not found");
    }

    const dbSave = referenceDataSavers[key];
    await dbSave((updatedData));
    updateReferenceDataState(key, updatedData);
    await putFile(entry.objectKey, encodeData(updatedData));
    const updatedManifest = bumpManifest(manifest, "references", key, { ...entry, version: updatedData.metadata.version });
    await saveManifest(updatedManifest);
  } catch (error) {
    if (plainPreviousData !== null) {
      await referenceDataSavers[key](plainPreviousData);
    }

    updateReferenceDataState(key, plainPreviousData);
    showError(getErrorMessage(error));
    throw error;
  } finally {
    setLoadingOff(loadingId);
  }
};

export const saveChunkData = async ({ key, data }: SaveTransactionDataInput): Promise<void> => {
  const loadingId = setLoadingOn();
  const previousChunk = getState().chunks[key];
  const plainPreviousChunk = previousChunk === undefined ? undefined : toPlain(previousChunk);

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
    await putFile(objectKey, encodeData(updatedData));

    const updatedManifest = bumpManifest(manifest, "chunks", key, { objectKey, version: updatedData.metadata.version });
    await saveManifest(updatedManifest);
  } catch (error) {
    if (plainPreviousChunk !== undefined) {
      await dbSaveChunk(key, plainPreviousChunk);
      updateChunksState(key, plainPreviousChunk);
    } else {
      await dbDeleteChunk(key);
      delete getState().chunks[key];
    }

    showError(getErrorMessage(error));
    throw error;
  } finally {
    setLoadingOff(loadingId);
  }
};