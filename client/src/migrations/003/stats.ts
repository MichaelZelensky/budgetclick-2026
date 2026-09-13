import { decryptData } from "@/encryption/encryption";
import { getRawManifest, generateObjectKey, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { getState } from "@/state/state";
import type { Manifest } from "@/types/storage/Manifest";
import type { StatisticsStorage } from "@/types/storage/StatisticsStorage";

const decodeManifest = (body: ArrayBuffer): Manifest => {
  return JSON.parse(new TextDecoder().decode(body)) as Manifest;
};

const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

export const migrateManifest = async (): Promise<void> => {
  const body = await getRawManifest();
  if (body === null) {
    return;
  }
  const decrypted = await decryptData(body);
  const manifest = decodeManifest(decrypted);
  if (manifest.statistics !== undefined) {
    return;
  }
  const now = new Date().toISOString();
  const statistics: StatisticsStorage = {
    metadata: {
      schemaVersion: 1,
      version: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    statistics: {},
  };
  const objectKey = generateObjectKey();
  await putFile(objectKey, encodeData(statistics));
  await saveManifest({
    ...manifest,
    statistics: {
      objectKey,
      version: 0,
    },
  });
};
