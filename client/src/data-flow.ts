import { toRaw } from "vue";
import { getState, updateState } from "@/state/state";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { dbSaveAccounts } from "@/repository/account";
import { dbSaveCategories } from "@/repository/category";
import { dbSaveContractors } from "@/repository/contractor";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
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