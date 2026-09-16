import { decryptData } from "@/encryption/encryption";
import { getRawManifest, generateObjectKey, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { getState } from "@/state/state";
import type { BalanceStorage } from "@/types/storage/BalanceStorage";
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
  if (manifest.statistics !== undefined && manifest.balances !== undefined) {
    return;
  }
  const now = new Date().toISOString();
  const statistics = manifest.statistics ?? {
    objectKey: generateObjectKey(),
    version: 0,
  };
  if (manifest.statistics === undefined) {
    const statisticsStorage: StatisticsStorage = {
      metadata: {
        schemaVersion: 1,
        version: 0,
        createdAt: now,
        updatedAt: now,
        updatedBy: getState().settings?.clientId ?? "-",
      },
      statistics: {},
    };
    await putFile(statistics.objectKey, encodeData(statisticsStorage));
  }
  const balances = manifest.balances ?? {
    objectKey: generateObjectKey(),
    version: 0,
  };
  if (manifest.balances === undefined) {
    const balanceStorage: BalanceStorage = {
      metadata: {
        schemaVersion: 1,
        version: 0,
        createdAt: now,
        updatedAt: now,
        updatedBy: getState().settings?.clientId ?? "-",
      },
      balances: [],
    };
    await putFile(balances.objectKey, encodeData(balanceStorage));
  }
  await saveManifest({
    ...manifest,
    statistics,
    balances,
  });
};