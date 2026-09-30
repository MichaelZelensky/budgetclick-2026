import { decryptData } from "@/encryption/encryption";
import { getRawManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { getState } from "@/state/state";
import type { CurrencyRatesStorage } from "@/types/storage/CurrencyRatesStorage";
import { decodeData, encodeData } from "@/utils/data";
import { Manifest } from "@/types/storage/Manifest";
import { generateObjectKey } from "@/utils/key";

export const migrateManifest = async (): Promise<void> => {
  const body = await getRawManifest();
  if (body === null) {
    return;
  }
  const decrypted = await decryptData(body);
  const manifest = decodeData<Manifest>(decrypted);
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