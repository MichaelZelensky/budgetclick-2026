import { toRaw } from "vue";
import { getState, updateState } from "@/state/state";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { dbSaveAccounts } from "@/repository/account";
import { dbSaveCategories } from "@/repository/category";
import { dbSaveContractors } from "@/repository/contractor";
import { dbSaveChunk } from "@/repository/transaction";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import { DataKey } from "@/types/data/DataKey.enum";

type DataTypes = {
  [DataKey.Accounts]: AccountsStorage;
  [DataKey.Categories]: CategoriesStorage;
  [DataKey.Contractors]: ContractorsStorage;
};

type SaveDataInput<K extends DataKey> = {
  key: K;
  data: DataTypes[K];
};

type SaveTransactionDataInput = {
  key: string;
  data: ChunkStorage;
};

const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

const updateManifest = async (key: DataKey, version: number): Promise<void> => {
  const manifest = getManifest();
  const entry = manifest.references[key];

  if (entry === undefined) {
    throw new Error("Manifest reference not found");
  }

  const now = new Date().toISOString();

  const updatedManifest = {
    ...manifest,
    version: manifest.version + 1,
    updatedAt: now,
    updatedBy: getState().settings?.clientId ?? "-",
    references: {
      ...manifest.references,
      [key]: {
        ...entry,
        version,
      },
    },
  };

  await saveManifest(updatedManifest);
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

export const saveData = async <K extends DataKey>({ key, data }: SaveDataInput<K>): Promise<void> => {
  const plainData = JSON.parse(JSON.stringify(toRaw(data))) as DataTypes[K];
  const updatedData = updateStorageMetadata(plainData);
  const manifest = getManifest();
  const entry = manifest.references[key];

  if (entry === undefined) {
    throw new Error("Manifest reference not found");
  }

  switch (key) {
    case DataKey.Accounts:
      await dbSaveAccounts(updatedData as AccountsStorage);
      break;
    case DataKey.Categories:
      await dbSaveCategories(updatedData as CategoriesStorage);
      break;
    case DataKey.Contractors:
      await dbSaveContractors(updatedData as ContractorsStorage);
      break;
  }

  updateState(key, updatedData);
  await putFile(entry.objectKey, encodeData(updatedData));
  await updateManifest(key, updatedData.metadata.version);
};

export const saveTransactionData = async ({ key, data }: SaveTransactionDataInput): Promise<void> => {
  const plainData = JSON.parse(JSON.stringify(toRaw(data))) as ChunkStorage;
  const now = new Date().toISOString();
  const entry = getManifest().chunks[key];
  const updatedData = {
    ...plainData,
    metadata: {
      ...plainData.metadata,
      version: plainData.metadata.version + 1,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
  };
  const objectKey = entry?.objectKey ?? generateObjectKey();
  const updatedManifest = {
    ...getManifest(),
    version: getManifest().version + 1,
    updatedAt: now,
    updatedBy: getState().settings?.clientId ?? "-",
    chunks: {
      ...getManifest().chunks,
      [key]: {
        objectKey,
        version: updatedData.metadata.version,
      },
    },
  };

  await dbSaveChunk(key, updatedData);
  updateState("chunks", {
    ...getState().data.chunks,
    [key]: updatedData,
  });
  await putFile(objectKey, encodeData(updatedData));
  await saveManifest(updatedManifest);
};