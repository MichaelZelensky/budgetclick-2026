// client/tests/unit/sync.test.ts

import { beforeEach, describe, expect, it, vi } from "vitest";
import { dbGetAccounts, dbSaveAccounts } from "@/repository/account";
import { dbGetCategories, dbSaveCategories } from "@/repository/category";
import { dbGetContractors, dbSaveContractors } from "@/repository/contractor";
import { dbGetChunks, dbSaveChunk } from "@/repository/transaction";
import { getManifest } from "@/manifest";
import { getFile } from "@/storage";
import { getState, initializeState } from "@/state/state";
import { importRemoteData, synchronizeRemoteData } from "@/sync";
import type { Manifest } from "@/types/storage/Manifest";

vi.mock("@/repository/account", () => ({
  dbGetAccounts: vi.fn(),
  dbSaveAccounts: vi.fn(),
}));

vi.mock("@/repository/category", () => ({
  dbGetCategories: vi.fn(),
  dbSaveCategories: vi.fn(),
}));

vi.mock("@/repository/contractor", () => ({
  dbGetContractors: vi.fn(),
  dbSaveContractors: vi.fn(),
}));

vi.mock("@/repository/transaction", () => ({
  dbGetChunks: vi.fn(),
  dbSaveChunk: vi.fn(),
}));

vi.mock("@/manifest", () => ({
  getManifest: vi.fn(),
}));

vi.mock("@/storage", () => ({
  getFile: vi.fn(),
}));

vi.mock("@/validators/default/AccountsStorage.js", () => ({
  default: vi.fn(() => true),
}));

vi.mock("@/validators/default/CategoriesStorage.js", () => ({
  default: vi.fn(() => true),
}));

vi.mock("@/validators/default/ContractorsStorage.js", () => ({
  default: vi.fn(() => true),
}));

vi.mock("@/validators/default/ChunkStorage.js", () => ({
  default: vi.fn(() => true),
}));

const mockedDbGetAccounts = vi.mocked(dbGetAccounts);
const mockedDbSaveAccounts = vi.mocked(dbSaveAccounts);
const mockedDbGetCategories = vi.mocked(dbGetCategories);
const mockedDbSaveCategories = vi.mocked(dbSaveCategories);
const mockedDbGetContractors = vi.mocked(dbGetContractors);
const mockedDbSaveContractors = vi.mocked(dbSaveContractors);
const mockedDbGetChunks = vi.mocked(dbGetChunks);
const mockedDbSaveChunk = vi.mocked(dbSaveChunk);
const mockedGetManifest = vi.mocked(getManifest);
const mockedGetFile = vi.mocked(getFile);

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const createManifest = (): Manifest => ({
  schemaVersion: 1,
  version: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  updatedBy: "client-123",
  references: {
    accounts: {
      objectKey: "accounts-key",
      version: 2,
    },
    categories: {
      objectKey: "categories-key",
      version: 2,
    },
    contractors: {
      objectKey: "contractors-key",
      version: 2,
    },
  },
  chunks: {
    "2026-09": {
      objectKey: "chunk-2026-09",
      version: 2,
    },
  },
  attachments: {
    root: "attachments",
  },
  migration: {
    version: 1,
    state: "idle",
  },
});

const createAccounts = (version: number) => ({
  metadata: {
    schemaVersion: 1,
    version,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    updatedBy: "client-123",
  },
  accounts: [],
});

const createCategories = (version: number) => ({
  metadata: {
    schemaVersion: 1,
    version,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    updatedBy: "client-123",
  },
  categories: [],
});

const createContractors = (version: number) => ({
  metadata: {
    schemaVersion: 1,
    version,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    updatedBy: "client-123",
  },
  contractors: [],
});

const createChunk = (version: number, transactions = [{}]) => ({
  metadata: {
    schemaVersion: 1,
    version,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    updatedBy: "client-123",
  },
  transactions,
});

const encode = (value: unknown): ArrayBuffer => {
  return new TextEncoder().encode(JSON.stringify(value)).buffer;
};

describe("sync", () => {
  beforeEach(() => {
    initializeState();
    mockedDbGetAccounts.mockReset();
    mockedDbSaveAccounts.mockReset();
    mockedDbGetCategories.mockReset();
    mockedDbSaveCategories.mockReset();
    mockedDbGetContractors.mockReset();
    mockedDbSaveContractors.mockReset();
    mockedDbGetChunks.mockReset();
    mockedDbSaveChunk.mockReset();
    mockedGetManifest.mockReset();
    mockedGetFile.mockReset();
    mockedDbSaveAccounts.mockResolvedValue();
    mockedDbSaveCategories.mockResolvedValue();
    mockedDbSaveContractors.mockResolvedValue();
    mockedDbSaveChunk.mockResolvedValue();
  });

  describe("importRemoteData", () => {
    it("imports reference data and transaction chunks", async () => {
      const currentMonth = getCurrentMonth();
      const manifest = createManifest();
      manifest.chunks = {
        [currentMonth]: {
          objectKey: `chunk-${currentMonth}`,
          version: 2,
        },
      };
      const accounts = createAccounts(2);
      const categories = createCategories(2);
      const contractors = createContractors(2);
      const chunk = createChunk(2);

      mockedGetFile.mockImplementation(async key => {
        const values: Record<string, ArrayBuffer> = {
          "accounts-key": encode(accounts),
          "categories-key": encode(categories),
          "contractors-key": encode(contractors),
          [`chunk-${currentMonth}`]: encode(chunk),
        };
        return values[key];
      });

      await importRemoteData(manifest);

      expect(mockedDbSaveAccounts).toHaveBeenCalledWith(accounts);
      expect(mockedDbSaveCategories).toHaveBeenCalledWith(categories);
      expect(mockedDbSaveContractors).toHaveBeenCalledWith(contractors);
      expect(mockedDbSaveChunk).toHaveBeenCalledWith(currentMonth, chunk);
      expect(getState().referenceData.accounts).toStrictEqual(accounts);
      expect(getState().referenceData.categories).toStrictEqual(categories);
      expect(getState().referenceData.contractors).toStrictEqual(contractors);
      expect(getState().chunks[currentMonth]).toStrictEqual(chunk);
    });
  });

  describe("synchronizeRemoteData", () => {
    it("downloads remote objects with newer versions", async () => {
      const manifest = createManifest();
      const accounts = createAccounts(2);
      const categories = createCategories(2);
      const contractors = createContractors(2);
      const chunk = createChunk(2);

      mockedGetManifest.mockReturnValue(manifest);
      mockedDbGetAccounts.mockResolvedValue(createAccounts(1));
      mockedDbGetCategories.mockResolvedValue(createCategories(1));
      mockedDbGetContractors.mockResolvedValue(createContractors(1));
      mockedDbGetChunks.mockResolvedValue({
        "2026-09": createChunk(1),
      });
      mockedGetFile.mockImplementation(async key => {
        const values: Record<string, ArrayBuffer> = {
          "accounts-key": encode(accounts),
          "categories-key": encode(categories),
          "contractors-key": encode(contractors),
          "chunk-2026-09": encode(chunk),
        };
        return values[key];
      });

      await synchronizeRemoteData();

      expect(mockedGetManifest).toHaveBeenCalledOnce();
      expect(mockedDbSaveAccounts).toHaveBeenCalledWith(accounts);
      expect(mockedDbSaveCategories).toHaveBeenCalledWith(categories);
      expect(mockedDbSaveContractors).toHaveBeenCalledWith(contractors);
      expect(mockedDbSaveChunk).toHaveBeenCalledWith("2026-09", chunk);
      expect(mockedGetFile).toHaveBeenCalledTimes(4);
      expect(getState().referenceData.accounts).toStrictEqual(accounts);
      expect(getState().referenceData.categories).toStrictEqual(categories);
      expect(getState().referenceData.contractors).toStrictEqual(contractors);
      expect(getState().chunks["2026-09"]).toStrictEqual(chunk);
    });

    it("does not download objects when local versions are current", async () => {
      const manifest = createManifest();

      mockedGetManifest.mockReturnValue(manifest);
      mockedDbGetAccounts.mockResolvedValue(createAccounts(2));
      mockedDbGetCategories.mockResolvedValue(createCategories(2));
      mockedDbGetContractors.mockResolvedValue(createContractors(2));
      mockedDbGetChunks.mockResolvedValue({
        "2026-09": createChunk(2),
      });

      await synchronizeRemoteData();

      expect(mockedGetFile).not.toHaveBeenCalled();
      expect(mockedDbSaveAccounts).not.toHaveBeenCalled();
      expect(mockedDbSaveCategories).not.toHaveBeenCalled();
      expect(mockedDbSaveContractors).not.toHaveBeenCalled();
      expect(mockedDbSaveChunk).not.toHaveBeenCalled();
    });

    it("downloads remote objects when local objects are missing", async () => {
      const manifest = createManifest();
      const accounts = createAccounts(2);
      const categories = createCategories(2);
      const contractors = createContractors(2);
      const chunk = createChunk(2);

      mockedGetManifest.mockReturnValue(manifest);
      mockedDbGetAccounts.mockResolvedValue(null);
      mockedDbGetCategories.mockResolvedValue(null);
      mockedDbGetContractors.mockResolvedValue(null);
      mockedDbGetChunks.mockResolvedValue({});
      mockedGetFile.mockImplementation(async key => {
        const values: Record<string, ArrayBuffer> = {
          "accounts-key": encode(accounts),
          "categories-key": encode(categories),
          "contractors-key": encode(contractors),
          "chunk-2026-09": encode(chunk),
        };
        return values[key];
      });

      await synchronizeRemoteData();

      expect(mockedDbSaveAccounts).toHaveBeenCalledWith(accounts);
      expect(mockedDbSaveCategories).toHaveBeenCalledWith(categories);
      expect(mockedDbSaveContractors).toHaveBeenCalledWith(contractors);
      expect(mockedDbSaveChunk).toHaveBeenCalledWith("2026-09", chunk);
    });

    it("rejects a remote object when its metadata version does not match the manifest", async () => {
      const manifest = createManifest();

      mockedGetManifest.mockReturnValue(manifest);
      mockedDbGetAccounts.mockResolvedValue(createAccounts(1));
      mockedDbGetCategories.mockResolvedValue(createCategories(2));
      mockedDbGetContractors.mockResolvedValue(createContractors(2));
      mockedDbGetChunks.mockResolvedValue({
        "2026-09": createChunk(2),
      });
      mockedGetFile.mockResolvedValue(encode(createAccounts(1)));

      await expect(synchronizeRemoteData()).rejects.toThrow(
        "Remote accounts version mismatch",
      );
    });
  });
});