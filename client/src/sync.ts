import { dbSaveAccounts } from "@/repository/account";
import { dbSaveCategories } from "@/repository/category";
import { dbSaveContractors } from "@/repository/contractor";
import { dbSaveChunk } from "@/repository/transaction";
import { getFile } from "@/storage";
import { updateChunksState, updateReferenceDataState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { Manifest, ManifestEntry } from "@/types/storage/Manifest";
import validateAccountsStorage from "@/validators/default/AccountsStorage.js";
import validateCategoriesStorage from "@/validators/default/CategoriesStorage.js";
import validateContractorsStorage from "@/validators/default/ContractorsStorage.js";
import validateChunkStorage from "@/validators/default/ChunkStorage.js";

const decodeData = (body: ArrayBuffer): unknown => {
  return JSON.parse(new TextDecoder().decode(body));
};

const loadRemoteObject = async <T>(
  entry: ManifestEntry,
  validator: (value: unknown) => boolean,
  name: string,
): Promise<T | null> => {
  if (entry.version === 0) {
    return null;
  }
  const body = await getFile(entry.objectKey);
  const value = decodeData(body);
  if (!validator(value)) {
    throw new Error(`Invalid ${name}`);
  }
  const data = value as T & { metadata: { version: number } };
  if (data.metadata.version !== entry.version) {
    throw new Error(`Remote ${name} version mismatch`);
  }
  return data;
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const loadChunks = async (
  manifest: Manifest,
  months: string[],
  limit: number,
): Promise<Record<string, ChunkStorage>> => {
  const chunks: Record<string, ChunkStorage> = {};
  let transactionCount = 0;
  for (const month of months) {
    const entry = manifest.chunks[month];
    if (entry === undefined || entry.version === 0) {
      continue;
    }
    const chunk = await loadRemoteObject<ChunkStorage>(
      entry,
      validateChunkStorage,
      "transaction chunk",
    );
    if (chunk === null) {
      continue;
    }
    chunks[month] = chunk;
    transactionCount += chunk.transactions.length;
    if (transactionCount >= limit) {
      break;
    }
  }
  return chunks;
};

const loadInitialTransactionChunks = async (
  manifest: Manifest,
): Promise<Record<string, ChunkStorage>> => {
  const currentMonth = getCurrentMonth();
  const months = Object.keys(manifest.chunks).sort();
  const currentAndFutureMonths = months.filter(month => month >= currentMonth);
  const currentAndFutureChunks = await loadChunks(manifest, currentAndFutureMonths, 100);
  if (Object.values(currentAndFutureChunks).some(chunk => chunk.transactions.length > 0)) {
    return currentAndFutureChunks;
  }
  const pastMonths = months
    .filter(month => month < currentMonth)
    .sort()
    .reverse();
  return loadChunks(manifest, pastMonths, 20);
};

export const importRemoteData = async (manifest: Manifest): Promise<void> => {
  const [accounts, categories, contractors, chunks] = await Promise.all([
    loadRemoteObject<AccountsStorage>(
      manifest.references.accounts,
      validateAccountsStorage,
      "accounts",
    ),
    loadRemoteObject<CategoriesStorage>(
      manifest.references.categories,
      validateCategoriesStorage,
      "categories",
    ),
    loadRemoteObject<ContractorsStorage>(
      manifest.references.contractors,
      validateContractorsStorage,
      "contractors",
    ),
    loadInitialTransactionChunks(manifest),
  ]);
  if (accounts !== null) {
    await dbSaveAccounts(accounts);
  }
  if (categories !== null) {
    await dbSaveCategories(categories);
  }
  if (contractors !== null) {
    await dbSaveContractors(contractors);
  }
  for (const [month, chunk] of Object.entries(chunks)) {
    await dbSaveChunk(month, chunk);
    updateChunksState(month, chunk);
  }
  updateReferenceDataState(ReferenceDataKey.Accounts, accounts);
  updateReferenceDataState(ReferenceDataKey.Categories, categories);
  updateReferenceDataState(ReferenceDataKey.Contractors, contractors);
};