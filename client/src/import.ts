import { strFromU8, unzipSync } from "fflate";
import { dbSaveAccounts } from "@/repository/account";
import { dbSaveCategories } from "@/repository/category";
import { dbSaveContractors } from "@/repository/contractor";
import { dbSaveRates } from "@/repository/rates";
import { dbSaveChunk } from "@/repository/transaction";
import { dbSaveOfflineSync } from "@/repository/offline-sync";
import { clearData } from "@/repository/data";
import { getManifest, saveManifest } from "@/manifest";
import { getState, resetStateData, updateChunksState, updateReferenceDataState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";
import type { Attachment } from "@/types/data/Attachment";
import type { Transaction } from "@/types/data/Transaction";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";
import type { ExportData } from "@/types/ExportData";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { rebuildBalances } from "@/balance";
import { rebuildStatistics } from "@/stats";
import { listRawFiles, putFile, removeRawFile } from "@/storage";
import { encodeBlob, encodeData } from "@/utils/data";
import { generateObjectKey } from "@/utils/key";
import { getSettings, updateSettings } from "@/state/settings";
import { saveSettings } from "@/settings";

const createMetadata = (clientId: string): StorageMetadata => {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    version: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: clientId,
  };
};

const toPlain = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

const parseData = (files: Record<string, Uint8Array>): ExportData => {
  const dataFile = files["data.json"];
  if (!dataFile) {
    throw new Error("Import file does not contain data.json");
  }

  const data = JSON.parse(strFromU8(dataFile)) as ExportData;
  if (
    data.formatVersion !== 1 ||
    !Array.isArray(data.accounts) ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.contractors) ||
    !Array.isArray(data.rates) ||
    !Array.isArray(data.transactions) ||
    data.attachments === null ||
    typeof data.attachments !== "object"
  ) {
    throw new Error("Invalid import data");
  }

  return data;
};

const getChunks = (transactions: Transaction[], clientId: string): Record<string, ChunkStorage> => {
  const grouped = transactions.reduce<Record<string, Transaction[]>>((result, transaction) => {
    const month = transaction.datetime.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error("Invalid transaction date");
    }
    return {
      ...result,
      [month]: [...(result[month] ?? []), transaction],
    };
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).map(([month, monthTransactions]) => [
      month,
      {
        metadata: createMetadata(clientId),
        transactions: monthTransactions,
      },
    ]),
  );
};

export const importData = async (file: File): Promise<void> => {
  const loadingId = setLoadingOn();
  try {
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const data = parseData(files);
    const clientId = getState().settings?.clientId ?? "-";
    const accounts = {
      metadata: createMetadata(clientId),
      accounts: data.accounts,
    };
    const categories = {
      metadata: createMetadata(clientId),
      categories: data.categories,
    };
    const contractors = {
      metadata: createMetadata(clientId),
      contractors: data.contractors,
    };
    const rates = {
      metadata: createMetadata(clientId),
      rates: data.rates,
    };
    const chunks = getChunks(data.transactions, clientId);
    const attachments = Object.fromEntries(
      Object.entries(data.attachments).map(([id, attachment]) => {
        const attachmentFile = files[`attachments/${id}-${attachment.name}`];
        if (!attachmentFile) {
          throw new Error(`Missing attachment: ${attachment.name}`);
        }
        const value: Attachment = {
          name: attachment.name,
          type: attachment.type,
          data: encodeBlob(attachmentFile.buffer),
        };
        return [id, value];
      }),
    );
    const manifest = toPlain(getManifest());
    const objectKeys = {
      accounts: generateObjectKey(),
      categories: generateObjectKey(),
      contractors: generateObjectKey(),
      rates: generateObjectKey(),
      chunks: Object.fromEntries(
        Object.keys(chunks).map(month => [month, generateObjectKey()]),
      ),
    };
    const now = new Date().toISOString();
    const updatedManifest = {
      ...manifest,
      version: manifest.version + 1,
      updatedAt: now,
      updatedBy: clientId,
      references: {
        accounts: {
          objectKey: objectKeys.accounts,
          version: accounts.metadata.version,
        },
        categories: {
          objectKey: objectKeys.categories,
          version: categories.metadata.version,
        },
        contractors: {
          objectKey: objectKeys.contractors,
          version: contractors.metadata.version,
        },
        rates: {
          objectKey: objectKeys.rates,
          version: rates.metadata.version,
        },
      },
      chunks: Object.fromEntries(
        Object.entries(chunks).map(([month, chunk]) => [
          month,
          {
            objectKey: objectKeys.chunks[month],
            version: chunk.metadata.version,
          },
        ]),
      ),
    };
    const remoteFiles = await listRawFiles();
    await Promise.all(
      remoteFiles
        .filter(key => key !== "manifest" && key !== "salt")
        .map(key => removeRawFile(key)),
    );
    await clearData();
    resetStateData();
    const firstAccount = accounts.accounts[0];
    if (firstAccount !== undefined) {
      const settings = {
        ...getSettings(),
        defaultCurrency: firstAccount.currency,
      };
      updateSettings(settings);
      saveSettings(settings);
    }
    await dbSaveOfflineSync({
      manifest: updatedManifest,
      objects: {
        chunks: {},
        statistics: false,
        accounts: false,
        categories: false,
        contractors: false,
        rates: false,
        balances: false,
        attachments: {},
      },
    });
    await Promise.all([
      dbSaveAccounts(accounts),
      dbSaveCategories(categories),
      dbSaveContractors(contractors),
      dbSaveRates(rates),
      ...Object.entries(chunks).map(([month, chunk]) => dbSaveChunk(month, chunk)),
    ]);
    await Promise.all([
      putFile(objectKeys.accounts, encodeData(accounts)),
      putFile(objectKeys.categories, encodeData(categories)),
      putFile(objectKeys.contractors, encodeData(contractors)),
      putFile(objectKeys.rates, encodeData(rates)),
      ...Object.entries(chunks).map(([month, chunk]) =>
        putFile(objectKeys.chunks[month], encodeData(chunk)),
      ),
      ...Object.entries(attachments).map(([id, attachment]) =>
        putFile(id, encodeData(attachment)),
      ),
    ]);
    await saveManifest(updatedManifest);
    updateReferenceDataState(ReferenceDataKey.Accounts, accounts);
    updateReferenceDataState(ReferenceDataKey.Categories, categories);
    updateReferenceDataState(ReferenceDataKey.Contractors, contractors);
    updateReferenceDataState(ReferenceDataKey.Rates, rates);
    Object.entries(chunks).forEach(([month, chunk]) => updateChunksState(month, chunk));
    await rebuildStatistics();
    await rebuildBalances();
    await dbSaveOfflineSync({
      manifest: updatedManifest,
      objects: {
        chunks: {},
        statistics: false,
        accounts: false,
        categories: false,
        contractors: false,
        rates: false,
        balances: false,
        attachments: {},
      },
    });
  } finally {
    setLoadingOff(loadingId);
  }
};