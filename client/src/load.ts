import { dbGetChunks, dbSaveChunk } from "@/repository/transaction";
import { getFile } from "@/storage";
import { updateChunksState } from "@/state/state";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { Manifest, ManifestEntry } from "@/types/storage/Manifest";
import validateChunkStorage from "@/validators/default/ChunkStorage.js";

const decodeData = (body: ArrayBuffer): unknown => {
  return JSON.parse(new TextDecoder().decode(body));
};

const loadRemoteChunk = async (
  entry: ManifestEntry,
): Promise<ChunkStorage | null> => {
  if (entry.version === 0) {
    return null;
  }
  const body = await getFile(entry.objectKey);
  const value = decodeData(body);
  if (!validateChunkStorage(value)) {
    throw new Error("Invalid transaction chunk");
  }
  const chunk = value as ChunkStorage;
  if (chunk.metadata.version !== entry.version) {
    throw new Error("Remote transaction chunk version mismatch");
  }
  return chunk;
};

const loadChunks = async (
  manifest: Manifest,
  months: string[],
  limit: number,
): Promise<Record<string, ChunkStorage>> => {
  const localChunks = await dbGetChunks();
  const chunks: Record<string, ChunkStorage> = {};
  let transactionCount = 0;

  for (const month of months) {
    const entry = manifest.chunks[month];
    if (entry === undefined || entry.version === 0) {
      continue;
    }

    let chunk = localChunks[month];

    if (chunk?.metadata.version !== entry.version) {
      chunk = await loadRemoteChunk(entry) ?? undefined;
      if (chunk === undefined) {
        continue;
      }
      await dbSaveChunk(month, chunk);
    }

    chunks[month] = chunk;
    updateChunksState(month, chunk);
    transactionCount += chunk.transactions.length;

    if (transactionCount >= limit) {
      break;
    }
  }

  return chunks;
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const loadInitialTransactionChunks = async (
  manifest: Manifest,
): Promise<Record<string, ChunkStorage>> => {
  const currentMonth = getCurrentMonth();
  const months = Object.keys(manifest.chunks).sort();
  const currentAndFutureMonths = months.filter(month => month >= currentMonth);
  const currentAndFutureChunks = await loadChunks(manifest, currentAndFutureMonths, 100);
  const transactionCount = Object.values(currentAndFutureChunks)
    .reduce((count, chunk) => count + chunk.transactions.length, 0);

  if (transactionCount >= 100) {
    return currentAndFutureChunks;
  }

  const pastMonths = months
    .filter(month => month < currentMonth)
    .sort()
    .reverse();
  const pastChunks = await loadChunks(manifest, pastMonths, 100 - transactionCount);

  return {
    ...pastChunks,
    ...currentAndFutureChunks,
  };
};

export const loadMoreTransactionChunks = async (
  manifest: Manifest,
  months: string[],
  limit: number,
): Promise<string[]> => {
  const chunks = await loadChunks(manifest, months, limit);
  return Object.keys(chunks);
};