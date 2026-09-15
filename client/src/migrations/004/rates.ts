import { decryptData } from "@/encryption/encryption";
import { getRawManifest, generateObjectKey, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { getState } from "@/state/state";
import type { CurrencyRatesStorage } from "@/types/storage/CurrencyRatesStorage";
import type { Manifest } from "@/types/storage/Manifest";

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
  if (manifest.references.rates !== undefined) {
    return;
  }
  const now = new Date().toISOString();
  const rates: CurrencyRatesStorage = {
    metadata: {
      schemaVersion: 1,
      version: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    rates: [],
  };
  const objectKey = generateObjectKey();
  await putFile(objectKey, encodeData(rates));
  await saveManifest({
    ...manifest,
    references: {
      ...manifest.references,
      rates: {
        objectKey,
        version: 0,
      },
    },
  });
};