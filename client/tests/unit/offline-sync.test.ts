import { beforeEach, describe, expect, it, vi } from "vitest";
import { getState, initializeState } from "@/state/state";
import {
  dbGetOfflineSync,
  dbSaveOfflineSync,
} from "@/repository/offline-sync";
import { dbGetChunks } from "@/repository/transaction";
import { dbGetStatistics } from "@/repository/statistics";
import { dbGetBalances } from "@/repository/balance";
import { dbGetAccounts } from "@/repository/account";
import { dbGetCategories } from "@/repository/category";
import { dbGetContractors } from "@/repository/contractor";
import { dbGetRates } from "@/repository/rates";
import { putFile } from "@/storage";
import { encodeData } from "@/utils/data";
import { manifestKey } from "@/manifest";
import {
  clearChunkPending,
  clearReferenceDataPending,
  initializeOfflineSync,
  setChunkPending,
  setObjectPending,
  setReferenceDataPending,
  synchronizeOfflineData,
} from "@/offline-sync";
import type { Manifest } from "@/types/storage/Manifest";
import type { OfflineSync } from "@/types/data/OfflineSync";

vi.mock("@/repository/offline-sync", () => ({
  dbGetOfflineSync: vi.fn(),
  dbSaveOfflineSync: vi.fn(),
}));

vi.mock("@/repository/transaction", () => ({
  dbGetChunks: vi.fn(),
}));

vi.mock("@/repository/statistics", () => ({
  dbGetStatistics: vi.fn(),
}));

vi.mock("@/repository/balance", () => ({
  dbGetBalances: vi.fn(),
}));

vi.mock("@/repository/account", () => ({
  dbGetAccounts: vi.fn(),
}));

vi.mock("@/repository/category", () => ({
  dbGetCategories: vi.fn(),
}));

vi.mock("@/repository/contractor", () => ({
  dbGetContractors: vi.fn(),
}));

vi.mock("@/repository/rates", () => ({
  dbGetRates: vi.fn(),
}));

vi.mock("@/storage", () => ({
  putFile: vi.fn(),
}));

vi.mock("@/utils/data", () => ({
  encodeData: vi.fn(data => data),
}));

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-id"),
  setLoadingOff: vi.fn(),
}));

const createManifest = (): Manifest => ({
  schemaVersion: 1,
  version: 1,
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
  updatedBy: "client-123",
  references: {
    accounts: {
      objectKey: "accounts",
      version: 1,
    },
    categories: {
      objectKey: "categories",
      version: 1,
    },
    contractors: {
      objectKey: "contractors",
      version: 1,
    },
    rates: {
      objectKey: "rates",
      version: 1,
    },
  },
  chunks: {
    "2026-09": {
      objectKey: "chunk-2026-09",
      version: 1,
    },
  },
  statistics: {
    objectKey: "statistics",
    version: 1,
  },
  balances: {
    objectKey: "balances",
    version: 1,
  },
  attachments: {
    root: "attachments",
  },
  migration: {
    version: 1,
    state: "idle",
  },
});

const createOfflineSync = (): OfflineSync => ({
  manifest: null,
  objects: {
    chunks: {},
    statistics: false,
    accounts: false,
    categories: false,
    contractors: false,
    rates: false,
    balances: false,
  },
});

describe("offline-sync", () => {
  beforeEach(() => {
    initializeState();

    vi.clearAllMocks();

    vi.mocked(dbGetOfflineSync).mockResolvedValue(createOfflineSync());
    vi.mocked(dbSaveOfflineSync).mockResolvedValue();

    vi.mocked(dbGetAccounts).mockResolvedValue([]);
    vi.mocked(dbGetCategories).mockResolvedValue([]);
    vi.mocked(dbGetContractors).mockResolvedValue([]);
    vi.mocked(dbGetRates).mockResolvedValue([]);
    vi.mocked(dbGetChunks).mockResolvedValue({});
    vi.mocked(dbGetStatistics).mockResolvedValue(null);
    vi.mocked(dbGetBalances).mockResolvedValue(null);

    vi.mocked(putFile).mockResolvedValue();
  });

  it("sets reference data pending", async () => {
    const offlineSync = createOfflineSync();

    vi.mocked(dbGetOfflineSync).mockResolvedValue(offlineSync);

    await setReferenceDataPending("accounts");

    expect(dbSaveOfflineSync).toHaveBeenCalledWith({
      ...offlineSync,
      objects: {
        ...offlineSync.objects,
        accounts: true,
      },
    });
  });

  it("clears reference data pending", async () => {
    const offlineSync = createOfflineSync();
    offlineSync.objects.accounts = true;

    vi.mocked(dbGetOfflineSync).mockResolvedValue(offlineSync);

    await clearReferenceDataPending("accounts");

    expect(dbSaveOfflineSync).toHaveBeenCalledWith({
      ...offlineSync,
      objects: {
        ...offlineSync.objects,
        accounts: false,
      },
    });
  });

  it("sets a chunk pending", async () => {
    const offlineSync = createOfflineSync();

    vi.mocked(dbGetOfflineSync).mockResolvedValue(offlineSync);

    await setChunkPending("2026-09");

    expect(dbSaveOfflineSync).toHaveBeenCalledWith({
      ...offlineSync,
      objects: {
        ...offlineSync.objects,
        chunks: {
          "2026-09": true,
        },
      },
    });
  });

  it("clears a chunk pending", async () => {
    const offlineSync = createOfflineSync();
    offlineSync.objects.chunks["2026-09"] = true;

    vi.mocked(dbGetOfflineSync).mockResolvedValue(offlineSync);

    await clearChunkPending("2026-09");

    expect(dbSaveOfflineSync).toHaveBeenCalledWith({
      ...offlineSync,
      objects: {
        ...offlineSync.objects,
        chunks: {
          "2026-09": false,
        },
      },
    });
  });

  it("sets an object pending", async () => {
    const offlineSync = createOfflineSync();

    vi.mocked(dbGetOfflineSync).mockResolvedValue(offlineSync);

    await setObjectPending("statistics", true);

    expect(dbSaveOfflineSync).toHaveBeenCalledWith({
      ...offlineSync,
      objects: {
        ...offlineSync.objects,
        statistics: true,
      },
    });
  });

  it("clears an object pending", async () => {
    const offlineSync = createOfflineSync();
    offlineSync.objects.balances = true;

    vi.mocked(dbGetOfflineSync).mockResolvedValue(offlineSync);

    await setObjectPending("balances", false);

    expect(dbSaveOfflineSync).toHaveBeenCalledWith({
      ...offlineSync,
      objects: {
        ...offlineSync.objects,
        balances: false,
      },
    });
  });

  it("does nothing while offline", async () => {
    getState().isOnline = false;

    await synchronizeOfflineData();

    expect(dbGetOfflineSync).not.toHaveBeenCalled();
    expect(putFile).not.toHaveBeenCalled();
  });

  it("does nothing when there is no pending data", async () => {
    getState().isOnline = true;

    await synchronizeOfflineData();

    expect(putFile).not.toHaveBeenCalled();
  });

  it("synchronizes pending objects in the required order", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;
    offlineSync.objects.categories = true;
    offlineSync.objects.contractors = true;
    offlineSync.objects.rates = true;
    offlineSync.objects.chunks["2026-09"] = true;
    offlineSync.objects.statistics = true;
    offlineSync.objects.balances = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    vi.mocked(dbGetAccounts).mockResolvedValue(["accounts"]);
    vi.mocked(dbGetCategories).mockResolvedValue(["categories"]);
    vi.mocked(dbGetContractors).mockResolvedValue(["contractors"]);
    vi.mocked(dbGetRates).mockResolvedValue(["rates"]);
    vi.mocked(dbGetChunks).mockResolvedValue({
      "2026-09": {
        metadata: {
          version: 1,
        },
        transactions: [],
      },
    });
    vi.mocked(dbGetStatistics).mockResolvedValue({
      income: 100,
      outcome: 50,
      balance: 50,
      accounts: {},
    });
    vi.mocked(dbGetBalances).mockResolvedValue({
      accounts: {},
    });

    await synchronizeOfflineData();

    const uploadedObjects = vi
      .mocked(putFile)
      .mock.calls
      .filter(([key]) => key !== manifestKey)
      .map(([key]) => key);

    expect(uploadedObjects).toEqual([
      "accounts",
      "categories",
      "contractors",
      "rates",
      "chunk-2026-09",
      "statistics",
      "balances",
    ]);
  });

  it("pushes the manifest after each object", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;
    offlineSync.objects.categories = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    vi.mocked(dbGetAccounts).mockResolvedValue(["accounts"]);
    vi.mocked(dbGetCategories).mockResolvedValue(["categories"]);

    await synchronizeOfflineData();

    expect(putFile.mock.calls.map(([key]) => key)).toEqual([
      "accounts",
      manifestKey,
      "categories",
      manifestKey,
    ]);
  });

  it("synchronizes reference data", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    const accounts = [{ id: "account-1" }];

    vi.mocked(dbGetAccounts).mockResolvedValue(accounts);

    await synchronizeOfflineData();

    expect(putFile).toHaveBeenCalledWith(
      "accounts",
      accounts,
    );

    expect(currentOfflineSync.objects.accounts).toBe(false);
  });

  it("synchronizes a pending chunk", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.chunks["2026-09"] = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    const chunk = {
      metadata: {
        version: 1,
      },
      transactions: [],
    };

    vi.mocked(dbGetChunks).mockResolvedValue({
      "2026-09": chunk,
    });

    await synchronizeOfflineData();

    expect(putFile).toHaveBeenCalledWith(
      "chunk-2026-09",
      chunk,
    );

    expect(currentOfflineSync.objects.chunks["2026-09"]).toBe(false);
  });

  it("synchronizes statistics", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.statistics = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    const statistics = {
      income: 100,
      outcome: 50,
      balance: 50,
      accounts: {},
    };

    vi.mocked(dbGetStatistics).mockResolvedValue(statistics);

    await synchronizeOfflineData();

    expect(putFile).toHaveBeenCalledWith(
      "statistics",
      statistics,
    );

    expect(currentOfflineSync.objects.statistics).toBe(false);
  });

  it("synchronizes balances", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.balances = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    const balances = {
      accounts: {},
    };

    vi.mocked(dbGetBalances).mockResolvedValue(balances);

    await synchronizeOfflineData();

    expect(putFile).toHaveBeenCalledWith(
      "balances",
      balances,
    );

    expect(currentOfflineSync.objects.balances).toBe(false);
  });

  it("clears the manifest after all objects are synchronized", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.statistics = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    vi.mocked(dbGetStatistics).mockResolvedValue({
      income: 100,
      outcome: 50,
      balance: 50,
      accounts: {},
    });

    await synchronizeOfflineData();

    expect(currentOfflineSync.manifest).toBeNull();
  });

  it("keeps an object pending when object upload fails", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    vi.mocked(dbGetAccounts).mockResolvedValue([
      { id: "account-1" },
    ]);

    vi.mocked(putFile).mockRejectedValueOnce(
      new Error("Storage unavailable"),
    );

    await synchronizeOfflineData();

    expect(currentOfflineSync.objects.accounts).toBe(true);
    expect(currentOfflineSync.manifest).not.toBeNull();

    expect(putFile).toHaveBeenCalledTimes(1);
  });

  it("keeps an object pending when manifest upload fails", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    vi.mocked(dbGetAccounts).mockResolvedValue([
      { id: "account-1" },
    ]);

    vi.mocked(putFile)
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("Storage unavailable"));

    await synchronizeOfflineData();

    expect(currentOfflineSync.objects.accounts).toBe(true);
    expect(currentOfflineSync.manifest).not.toBeNull();

    expect(putFile).toHaveBeenCalledTimes(2);
  });

  it("does not synchronize dependents when a prerequisite fails", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;
    offlineSync.objects.chunks["2026-09"] = true;
    offlineSync.objects.statistics = true;
    offlineSync.objects.balances = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    vi.mocked(dbGetAccounts).mockResolvedValue([
      { id: "account-1" },
    ]);

    vi.mocked(putFile).mockRejectedValue(
      new Error("Storage unavailable"),
    );

    await synchronizeOfflineData();

    expect(putFile).toHaveBeenCalledTimes(1);
    expect(putFile).toHaveBeenCalledWith(
      "accounts",
      [{ id: "account-1" }],
    );

    expect(currentOfflineSync.objects.accounts).toBe(true);
    expect(currentOfflineSync.objects.chunks["2026-09"]).toBe(true);
    expect(currentOfflineSync.objects.statistics).toBe(true);
    expect(currentOfflineSync.objects.balances).toBe(true);

    expect(dbGetChunks).not.toHaveBeenCalled();
    expect(dbGetStatistics).not.toHaveBeenCalled();
    expect(dbGetBalances).not.toHaveBeenCalled();
  });

  it("retries pending data on the next synchronization", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    vi.mocked(dbGetAccounts).mockResolvedValue([
      { id: "account-1" },
    ]);

    vi.mocked(putFile)
      .mockRejectedValueOnce(new Error("Storage unavailable"))
      .mockResolvedValue();

    await synchronizeOfflineData();

    expect(currentOfflineSync.objects.accounts).toBe(true);

    await synchronizeOfflineData();

    expect(currentOfflineSync.objects.accounts).toBe(false);
    expect(currentOfflineSync.manifest).toBeNull();
  });

  it("encodes objects before uploading them", async () => {
    getState().isOnline = true;

    const manifest = createManifest();
    const offlineSync = createOfflineSync();

    offlineSync.manifest = manifest;
    offlineSync.objects.accounts = true;

    let currentOfflineSync = offlineSync;

    vi.mocked(dbGetOfflineSync).mockImplementation(
      async () => currentOfflineSync,
    );

    vi.mocked(dbSaveOfflineSync).mockImplementation(async value => {
      currentOfflineSync = value;
    });

    const accounts = [{ id: "account-1" }];

    vi.mocked(dbGetAccounts).mockResolvedValue(accounts);

    await synchronizeOfflineData();

    expect(encodeData).toHaveBeenCalledWith(accounts);
    expect(encodeData).toHaveBeenCalledWith(manifest);
  });

  it("initializes the online state", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    initializeOfflineSync();

    expect(getState().isOnline).toBe(true);
  });
});