import { strFromU8, unzipSync, zipSync } from "fflate";
import { dbSaveAccounts } from "@/repository/account";
import { dbSaveCategories } from "@/repository/category";
import { dbSaveContractors } from "@/repository/contractor";
import { dbSaveRates } from "@/repository/rates";
import { dbSaveRecurrences } from "@/repository/recurrence";
import { dbSaveChunk } from "@/repository/transaction";
import { dbSaveOfflineSync } from "@/repository/offline-sync";
import { clearData } from "@/repository/data";
import { getManifest, saveManifest } from "@/manifest";
import { getState, resetStateData, updateChunksState, updateReferenceDataState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";
import type { Attachment } from "@/types/data/Attachment";
import type { Transaction } from "@/types/data/Transaction";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { ExportData } from "@/types/ExportData";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { rebuildBalances } from "@/balance";
import { rebuildStatistics } from "@/stats";
import { isFileTooLargeError, listRawFiles, putFile, removeRawFile } from "@/storage";
import { encryptData } from "@/encryption/encryption";
import { encodeBlob, encodeData } from "@/utils/data";
import { generateObjectKey } from "@/utils/key";
import { getSettings, updateSettings } from "@/state/settings";
import { saveSettings } from "@/settings";
import { createMetadata } from "@/utils/metadata";

const toPlain = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

const uploadFiles = async (uploads: Array<() => Promise<void>>): Promise<void> => {
  const batchSize = 5;
  const batches = Array.from(
    { length: Math.ceil(uploads.length / batchSize) },
    (_, index) => uploads.slice(index * batchSize, (index + 1) * batchSize),
  );
  for (const batch of batches) {
    await Promise.all(batch.map(upload => upload()));
  }
};

const parseData = (files: Record<string, Uint8Array>): ExportData => {
  const dataFile = files["data.json"];
  if (!dataFile) {
    throw new Error("Import file does not contain data.json");
  }

  const data = JSON.parse(strFromU8(dataFile)) as {
    formatVersion: number;
    accounts: ExportData["accounts"];
    categories: ExportData["categories"];
    contractors: ExportData["contractors"];
    rates: ExportData["rates"];
    recurrences?: ExportData["recurrences"];
    transactions: ExportData["transactions"];
    attachments: ExportData["attachments"];
  };

  if (
    (data.formatVersion !== 1 && data.formatVersion !== 2) ||
    !Array.isArray(data.accounts) ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.contractors) ||
    !Array.isArray(data.rates) ||
    (data.formatVersion === 2 && !Array.isArray(data.recurrences)) ||
    !Array.isArray(data.transactions) ||
    data.attachments === null ||
    typeof data.attachments !== "object"
  ) {
    throw new Error("Invalid import data");
  }

  return {
    ...data,
    formatVersion: 2,
    recurrences: data.recurrences ?? [],
  };
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
        metadata: createMetadata(1, clientId),
        transactions: monthTransactions,
      },
    ]),
  );
};

export const importData = async (file: File): Promise<Blob | null> => {
  const loadingId = setLoadingOn();
  try {
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const data = parseData(files);
    const clientId = getState().settings?.clientId ?? "-";
    const accounts = {
      metadata: createMetadata(1, clientId),
      accounts: data.accounts,
    };
    const categories = {
      metadata: createMetadata(1, clientId),
      categories: data.categories,
    };
    const contractors = {
      metadata: createMetadata(1, clientId),
      contractors: data.contractors,
    };
    const rates = {
      metadata: createMetadata(1, clientId),
      rates: data.rates,
    };
    const recurrences = {
      metadata: createMetadata(1, clientId),
      recurrences: data.recurrences,
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
      recurrences: generateObjectKey(),
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
        recurrences: {
          objectKey: objectKeys.recurrences,
          version: recurrences.metadata.version,
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
    await uploadFiles(
      remoteFiles
        .filter(key => key !== "manifest" && key !== "salt")
        .map(key => () => removeRawFile(key)),
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
        recurrences: false,
        balances: false,
        attachments: {},
      },
    });
    await Promise.all([
      dbSaveAccounts(accounts),
      dbSaveCategories(categories),
      dbSaveContractors(contractors),
      dbSaveRates(rates),
      dbSaveRecurrences(recurrences),
      ...Object.entries(chunks).map(([month, chunk]) => dbSaveChunk(month, chunk)),
    ]);
    const oversizedFiles: Record<string, Uint8Array> = {};
    await uploadFiles([
      ...[
        [objectKeys.accounts, accounts],
        [objectKeys.categories, categories],
        [objectKeys.contractors, contractors],
        [objectKeys.rates, rates],
        [objectKeys.recurrences, recurrences],
        ...Object.entries(chunks).map(([month, chunk]) => [objectKeys.chunks[month], chunk]),
        ...Object.entries(attachments).map(([id, attachment]) => [id, attachment]),
      ].map(([key, value]) => async () => {
        const body = encodeData(value);
        try {
          await putFile(key as string, body);
        } catch (error) {
          const attachment = attachments[key as string];
          if (!isFileTooLargeError(error) || attachment === undefined) {
            throw error;
          }
          const encrypted = await encryptData(body);
          oversizedFiles[`${(key as string)[0]}/${key}`] = encrypted;
          console.debug(`Import oversized: ${key}, name=${attachment.name}, file=${files[`attachments/${key}-${attachment.name}`]?.byteLength} bytes, envelope=${body.byteLength} bytes, encrypted=${encrypted.byteLength} bytes (${(encrypted.byteLength / 1024 / 1024).toFixed(2)} MB)`);
          await putFile(key as string, encodeData({ ...attachment, data: encodeBlob(new ArrayBuffer(0)) }));
        }
      }),
    ]);
    await saveManifest(updatedManifest);
    updateReferenceDataState(ReferenceDataKey.Accounts, accounts);
    updateReferenceDataState(ReferenceDataKey.Categories, categories);
    updateReferenceDataState(ReferenceDataKey.Contractors, contractors);
    updateReferenceDataState(ReferenceDataKey.Rates, rates);
    updateReferenceDataState(ReferenceDataKey.Recurrences, recurrences);
    Object.entries(chunks).forEach(([month, chunk]) => updateChunksState(month, chunk));
    await rebuildStatistics();
    await rebuildBalances();
    return Object.keys(oversizedFiles).length > 0 ? new Blob([zipSync(oversizedFiles)], { type: "application/zip" }) : null;
  } finally {
    setLoadingOff(loadingId);
  }
};