import type { Manifest } from "@/types/storage/Manifest";
import validateManifest from "@/validators/default/Manifest.js";
import { getState } from "@/state/state";
import { getFile, getRawFile, isFileNotFoundError, putFile } from "@/storage";
import { decryptData } from "@/encryption/encryption";
import { dbGetOfflineSync, dbSaveOfflineSync } from "@/repository/offline-sync";
import { decodeData, encodeData } from "@/utils/data";
import { generateObjectKey } from "@/utils/key";

export const manifestKey = "manifest";

const validateManifestData = (value: unknown): Manifest => {
  if (!validateManifest(value)) {
    const errors = validateManifest.errors
      ?.map(x => `${x.instancePath || "/"}: ${x.message}`)
      .join("\n");
    throw new Error(`Invalid manifest\n${errors}`);
  }
  return value;
};

export const createManifest = (clientId: string): Manifest => {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    version: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: clientId,
    references: {
      accounts: {
        objectKey: generateObjectKey(),
        version: 0,
      },
      categories: {
        objectKey: generateObjectKey(),
        version: 0,
      },
      contractors: {
        objectKey: generateObjectKey(),
        version: 0,
      },
      rates: {
        objectKey: generateObjectKey(),
        version: 0,
      },
    },
    chunks: {},
    statistics: {
      objectKey: generateObjectKey(),
      version: 0,
    },
    balances: {
      objectKey: generateObjectKey(),
      version: 0,
    },
    attachments: {
      root: generateObjectKey(),
    },
    migration: {
      version: 1,
      state: "idle",
    },
  };
};

export const getRawManifest = (): Promise<ArrayBuffer | null> => {
  return getRawFile(manifestKey);
};

export const decryptRemoteManifest = async (body: ArrayBuffer): Promise<Manifest> => {
  const decrypted = await decryptData(body);
  return validateManifestData(decodeData<Manifest>(decrypted));
};

export const initializeManifest = async (): Promise<boolean> => {
  try {
    const body = await getFile(manifestKey);
    const manifest = validateManifestData(decodeData<Manifest>(body));
    getState().manifest = structuredClone(manifest);
    return true;
  } catch (error) {
    if (isFileNotFoundError(error)) {
      getState().manifest = null;
      return false;
    }
    throw error;
  }
};

export const getManifest = (): Readonly<Manifest> => {
  const manifest = getState().manifest;
  if (manifest === null) {
    throw new Error("Manifest has not been initialized");
  }
  return manifest;
};

export const saveManifest = async (manifest: Manifest): Promise<void> => {
  const plainManifest = JSON.parse(JSON.stringify(manifest)) as Manifest;
  const validatedManifest = validateManifestData(plainManifest);
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    manifest: validatedManifest,
  });
  getState().manifest = structuredClone(validatedManifest);
};

export const clearManifestPending = async (): Promise<void> => {
  const offlineSync = await dbGetOfflineSync();
  await dbSaveOfflineSync({
    ...offlineSync,
    manifest: null,
  });
};

export const initializeNewManifest = async (clientId: string): Promise<void> => {
  const manifest = createManifest(clientId);
  await saveManifest(manifest);
  await putFile(manifestKey, encodeData(manifest));
  await clearManifestPending();
};