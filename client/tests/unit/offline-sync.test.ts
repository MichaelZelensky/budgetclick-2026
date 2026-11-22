import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
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
import { dbGetRecurrences } from "@/repository/recurrence";
import { headRawFile, putFile } from "@/storage";
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

vi.mock("@/repository/recurrence", () => ({
  dbGetRecurrences: vi.fn(),
}));

vi.mock("@/storage", () => ({
  putFile: vi.fn(),
  headRawFile: vi.fn(),
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
    recurrences: {
      objectKey: "recurrences",
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
    recurrences: false,
    balances: false,
    attachments: {},
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
    vi.mocked(dbGetRecurrences).mockResolvedValue([]);
    vi.mocked(dbGetChunks).mockResolvedValue({});
    vi.mocked(dbGetStatistics).mockResolvedValue(null);
    vi.mocked(dbGetBalances).mockResolvedValue(null);

    vi.mocked(putFile).mockResolvedValue();
    vi.mocked(headRawFile).mockResolvedValue(true);
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
    offlineSync.objects.recurrences = true;
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
    vi.mocked(dbGetRecurrences).mockResolvedValue(["recurrences"]);
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
      "recurrences",
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

    expect(vi.mocked(putFile).mock.calls.map(([key]) => key)).toEqual([
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

  it("continues synchronizing dependents when a prerequisite fails", async () => {
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

    vi.mocked(dbGetAccounts).mockResolvedValue([{ id: "account-1" }]);
    vi.mocked(dbGetChunks).mockResolvedValue({
      "2026-09": [{ id: "transaction-1" }],
    });
    vi.mocked(dbGetStatistics).mockResolvedValue({
      "2026-09": {},
    });
    vi.mocked(dbGetBalances).mockResolvedValue({
      "2026-09": {},
    });

    vi.mocked(putFile)
      .mockRejectedValueOnce(new Error("Storage unavailable"))
      .mockResolvedValue();

    await synchronizeOfflineData();

    expect(putFile).toHaveBeenCalledWith(
      "accounts",
      [{ id: "account-1" }],
    );

    expect(currentOfflineSync.objects.accounts).toBe(true);
    expect(currentOfflineSync.objects.chunks["2026-09"]).toBe(false);
    expect(currentOfflineSync.objects.statistics).toBe(false);
    expect(currentOfflineSync.objects.balances).toBe(false);

    expect(dbGetChunks).toHaveBeenCalledTimes(1);
    expect(dbGetStatistics).toHaveBeenCalledTimes(1);
    expect(dbGetBalances).toHaveBeenCalledTimes(1);
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

describe("offline-sync storage probing", () => {
  const setVisibility = (state: "visible" | "hidden"): void => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => state,
    });
  };

  const goOffline = async (): Promise<void> => {
    getState().isOnline = false;
    await nextTick();
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    vi.clearAllMocks();

    vi.mocked(dbGetOfflineSync).mockResolvedValue(createOfflineSync());
    vi.mocked(dbSaveOfflineSync).mockResolvedValue();
    vi.mocked(putFile).mockResolvedValue();
    vi.mocked(headRawFile).mockRejectedValue(new Error("Storage unavailable"));

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    setVisibility("visible");

    initializeState();
    initializeOfflineSync();

    // Let the online-state watcher settle so timers and backoff are reset.
    getState().isOnline = true;
    await nextTick();
  });

  afterEach(async () => {
    getState().isOnline = true;
    await nextTick();
    vi.useRealTimers();
  });

  it("does not probe while online", async () => {
    await vi.advanceTimersByTimeAsync(600_000);

    expect(headRawFile).not.toHaveBeenCalled();
  });

  it("probes the manifest after the initial delay once offline", async () => {
    await goOffline();

    await vi.advanceTimersByTimeAsync(29_999);
    expect(headRawFile).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(headRawFile).toHaveBeenCalledTimes(1);
    expect(headRawFile).toHaveBeenCalledWith(manifestKey);
  });

  it("synchronizes pending data when a probe finds the storage reachable", async () => {
    vi.mocked(headRawFile).mockImplementation(async () => {
      getState().isOnline = true;
      return true;
    });

    await goOffline();
    await vi.advanceTimersByTimeAsync(30_000);

    expect(getState().isOnline).toBe(true);
    expect(dbGetOfflineSync).toHaveBeenCalled();
  });

  it("stops probing once the storage is reachable", async () => {
    vi.mocked(headRawFile).mockImplementation(async () => {
      getState().isOnline = true;
      return true;
    });

    await goOffline();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(headRawFile).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(600_000);
    expect(headRawFile).toHaveBeenCalledTimes(1);
  });

  it("backs off exponentially while the storage stays unreachable", async () => {
    await goOffline();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(headRawFile).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(59_999);
    expect(headRawFile).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(headRawFile).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(119_999);
    expect(headRawFile).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(headRawFile).toHaveBeenCalledTimes(3);
  });

  it("caps the backoff delay at five minutes", async () => {
    await goOffline();

    // Delays: 30s, 60s, 120s, 240s, then capped at 300s.
    await vi.advanceTimersByTimeAsync(30_000 + 60_000 + 120_000 + 240_000);
    expect(headRawFile).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(299_999);
    expect(headRawFile).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(1);
    expect(headRawFile).toHaveBeenCalledTimes(5);

    await vi.advanceTimersByTimeAsync(299_999);
    expect(headRawFile).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(1);
    expect(headRawFile).toHaveBeenCalledTimes(6);
  });

  it("resets the backoff after the storage becomes reachable", async () => {
    await goOffline();

    await vi.advanceTimersByTimeAsync(30_000 + 60_000);
    expect(headRawFile).toHaveBeenCalledTimes(2);

    getState().isOnline = true;
    await nextTick();
    vi.mocked(headRawFile).mockClear();

    await goOffline();

    await vi.advanceTimersByTimeAsync(29_999);
    expect(headRawFile).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(headRawFile).toHaveBeenCalledTimes(1);
  });

  it("stops probing when the state turns online by other means", async () => {
    await goOffline();

    getState().isOnline = true;
    await nextTick();

    await vi.advanceTimersByTimeAsync(600_000);

    expect(headRawFile).not.toHaveBeenCalled();
  });

  it("does not probe while the page is hidden", async () => {
    setVisibility("hidden");

    await goOffline();
    await vi.advanceTimersByTimeAsync(600_000);

    expect(headRawFile).not.toHaveBeenCalled();
  });

  it("probes immediately when the page becomes visible while offline", async () => {
    setVisibility("hidden");
    await goOffline();

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);

    expect(headRawFile).toHaveBeenCalledTimes(1);
  });

  it("cancels the scheduled probe when the page becomes hidden", async () => {
    await goOffline();

    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    await vi.advanceTimersByTimeAsync(600_000);

    expect(headRawFile).not.toHaveBeenCalled();
  });

  it("probes immediately on the online event while offline", async () => {
    await goOffline();

    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);

    expect(headRawFile).toHaveBeenCalledTimes(1);
  });

  it("does not probe on the online event when the state is already online", async () => {
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);

    expect(headRawFile).not.toHaveBeenCalled();
  });

  it("marks the storage offline on the offline event and schedules a probe", async () => {
    window.dispatchEvent(new Event("offline"));
    await nextTick();

    expect(getState().isOnline).toBe(false);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(headRawFile).toHaveBeenCalledTimes(1);
  });

  it("does not run overlapping probes", async () => {
    let resolveProbe: (value: boolean) => void = () => undefined;
    vi.mocked(headRawFile).mockImplementation(
      () => new Promise<boolean>(resolve => {
        resolveProbe = resolve;
      }),
    );

    await goOffline();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(headRawFile).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(headRawFile).toHaveBeenCalledTimes(1);

    resolveProbe(true);
    await vi.advanceTimersByTimeAsync(0);
  });
});