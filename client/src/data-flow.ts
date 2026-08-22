import { toRaw } from "vue";
import { getState, updateState } from "@/state/state";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { dbSaveAccounts } from "@/repository/account";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import { DataKey } from "./types/data/DataKey.enum";

type DataTypes = {
  [DataKey.Accounts]: AccountsStorage;
};

type SaveDataInput<K extends DataKey> = {
  key: K;
  data: DataTypes[K];
};

const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

const updateManifest = async (key: DataKey): Promise<void> => {
  const manifest = getManifest();

  if (manifest === null) {
    throw new Error("Manifest has not been initialized");
  }

  const references = Object.entries(manifest.references);
  const reference = references.find(([, entry]) => entry.objectKey === key);

  if (reference === undefined) {
    throw new Error("Manifest reference not found");
  }

  const [referenceKey, entry] = reference;
  const now = new Date().toISOString();
  const version = entry.version + 1;

  const updatedManifest = {
    ...manifest,
    version: manifest.version + 1,
    updatedAt: now,
    updatedBy: getState().settings?.clientId ?? "-",
    references: {
      ...manifest.references,
      [referenceKey]: {
        ...entry,
        version,
      },
    },
  };

  saveManifest(updatedManifest);
  await putFile("manifest.json", encodeData(updatedManifest));
};

const getSaveFunction = <K extends DataKey>(key: K) => {
  switch (key) {
    case DataKey.Accounts:
      return dbSaveAccounts;
    default:
      throw new Error(`No repository found for key: ${key}`);
  }
};

export const saveData = async <K extends DataKey>({ key, data }: SaveDataInput<K>): Promise<void> => {
  const plainData = JSON.parse(JSON.stringify(toRaw(data))) as DataTypes[K];
  const save = getSaveFunction(key);
  await save(plainData);
  updateState(key, plainData);
  await putFile(key, encodeData(plainData));
  // await updateManifest(key);
};