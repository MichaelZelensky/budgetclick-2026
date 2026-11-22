import { beforeEach, describe, expect, it, vi } from "vitest";

import { initializeStorageData } from "@/init-storage";
import { getState, initializeState } from "@/state/state";
import { initializeStoredEncryptionKey } from "@/encryption/key";
import { initializeManifest } from "@/manifest";
import { initializeData } from "@/repository/data";
import { synchronizeRemoteData } from "@/sync";
import { synchronizeOfflineData } from "@/offline-sync";
import { migrateStorage } from "@/migrations/migrate";
import { createStorageUnavailableError } from "@/storage";

vi.mock("@/encryption/encryption", () => ({
  decryptData: vi.fn(),
  encryptData: vi.fn(),
}));

vi.mock("@/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/encryption/key", () => ({
  initializeStoredEncryptionKey: vi.fn(),
}));

vi.mock("@/manifest", () => ({
  initializeManifest: vi.fn(),
}));

vi.mock("@/repository/data", () => ({
  initializeData: vi.fn(),
}));

vi.mock("@/sync", () => ({
  synchronizeRemoteData: vi.fn(),
}));

vi.mock("@/offline-sync", () => ({
  synchronizeOfflineData: vi.fn(),
}));

vi.mock("@/migrations/migrate", () => ({
  migrateStorage: vi.fn(),
}));

const mockedInitializeStoredEncryptionKey = vi.mocked(initializeStoredEncryptionKey);
const mockedInitializeManifest = vi.mocked(initializeManifest);
const mockedInitializeData = vi.mocked(initializeData);
const mockedSynchronizeRemoteData = vi.mocked(synchronizeRemoteData);
const mockedSynchronizeOfflineData = vi.mocked(synchronizeOfflineData);
const mockedMigrateStorage = vi.mocked(migrateStorage);

const setSettings = (storage: string, clientId: string): void => {
  getState().settings = {
    schemaVersion: 1,
    storage,
    clientId,
  };
};

describe("storage data initialization", () => {
  beforeEach(() => {
    initializeState();

    vi.clearAllMocks();

    mockedInitializeStoredEncryptionKey.mockResolvedValue(true);
    mockedMigrateStorage.mockResolvedValue(undefined);
    mockedInitializeManifest.mockResolvedValue(true);
    mockedInitializeData.mockResolvedValue(undefined);
    mockedSynchronizeOfflineData.mockResolvedValue(undefined);
    mockedSynchronizeRemoteData.mockResolvedValue(undefined);

    setSettings("test-storage", "client-123");
    getState().isOnline = true;
  });

  it("does nothing when storage is not configured", async () => {
    setSettings("-", "client-123");

    await initializeStorageData();

    expect(mockedInitializeStoredEncryptionKey).not.toHaveBeenCalled();
    expect(mockedMigrateStorage).not.toHaveBeenCalled();
    expect(mockedInitializeManifest).not.toHaveBeenCalled();
    expect(mockedInitializeData).not.toHaveBeenCalled();
    expect(mockedSynchronizeOfflineData).not.toHaveBeenCalled();
    expect(mockedSynchronizeRemoteData).not.toHaveBeenCalled();
  });

  it("does nothing when client id is not configured", async () => {
    setSettings("test-storage", "-");

    await initializeStorageData();

    expect(mockedInitializeStoredEncryptionKey).not.toHaveBeenCalled();
    expect(mockedMigrateStorage).not.toHaveBeenCalled();
    expect(mockedInitializeManifest).not.toHaveBeenCalled();
    expect(mockedInitializeData).not.toHaveBeenCalled();
    expect(mockedSynchronizeRemoteData).not.toHaveBeenCalled();
  });

  it("does not continue when the encryption key is unavailable", async () => {
    mockedInitializeStoredEncryptionKey.mockResolvedValue(false);

    await initializeStorageData();

    expect(mockedInitializeStoredEncryptionKey).toHaveBeenCalledOnce();
    expect(mockedMigrateStorage).not.toHaveBeenCalled();
    expect(mockedInitializeManifest).not.toHaveBeenCalled();
    expect(mockedInitializeData).not.toHaveBeenCalled();
    expect(mockedSynchronizeRemoteData).not.toHaveBeenCalled();
  });

  it("initializes encryption and storage migration before loading the manifest", async () => {
    await initializeStorageData();

    expect(mockedInitializeStoredEncryptionKey).toHaveBeenCalledOnce();
    expect(mockedMigrateStorage).toHaveBeenCalledOnce();
    expect(mockedInitializeManifest).toHaveBeenCalledOnce();

    expect(mockedInitializeStoredEncryptionKey.mock.invocationCallOrder[0])
      .toBeLessThan(mockedMigrateStorage.mock.invocationCallOrder[0]);

    expect(mockedMigrateStorage.mock.invocationCallOrder[0])
      .toBeLessThan(mockedInitializeManifest.mock.invocationCallOrder[0]);
  });

  it("does not initialize data or synchronize when the manifest is not initialized", async () => {
    mockedInitializeManifest.mockResolvedValue(false);

    await initializeStorageData();

    expect(mockedInitializeManifest).toHaveBeenCalledOnce();
    expect(mockedInitializeData).not.toHaveBeenCalled();
    expect(mockedSynchronizeOfflineData).not.toHaveBeenCalled();
    expect(mockedSynchronizeRemoteData).not.toHaveBeenCalled();
  });

  it("initializes data and synchronizes when online", async () => {
    await initializeStorageData();

    expect(mockedInitializeData).toHaveBeenCalledOnce();
    expect(mockedSynchronizeOfflineData).toHaveBeenCalledOnce();
    expect(mockedSynchronizeRemoteData).toHaveBeenCalledOnce();
  });

  it("synchronizes offline data before remote data, after local data is initialized", async () => {
    await initializeStorageData();

    expect(mockedInitializeData.mock.invocationCallOrder[0])
      .toBeLessThan(mockedSynchronizeOfflineData.mock.invocationCallOrder[0]);

    expect(mockedSynchronizeOfflineData.mock.invocationCallOrder[0])
      .toBeLessThan(mockedSynchronizeRemoteData.mock.invocationCallOrder[0]);
  });

  it("initializes data but skips synchronization when offline", async () => {
    getState().isOnline = false;

    await initializeStorageData();

    expect(mockedInitializeManifest).toHaveBeenCalledOnce();
    expect(mockedInitializeData).toHaveBeenCalledOnce();
    expect(mockedSynchronizeOfflineData).not.toHaveBeenCalled();
    expect(mockedSynchronizeRemoteData).not.toHaveBeenCalled();
  });

  it("continues with local data when migration cannot reach the storage", async () => {
    mockedMigrateStorage.mockImplementation(async () => {
      getState().isOnline = false;
      throw createStorageUnavailableError();
    });

    await initializeStorageData();

    expect(mockedInitializeManifest).toHaveBeenCalledOnce();
    expect(mockedInitializeData).toHaveBeenCalledOnce();
    expect(mockedSynchronizeOfflineData).not.toHaveBeenCalled();
    expect(mockedSynchronizeRemoteData).not.toHaveBeenCalled();
  });

  it("continues with local data when migration fails with a network error", async () => {
    mockedMigrateStorage.mockRejectedValue(new TypeError("Failed to fetch"));
    getState().isOnline = false;

    await initializeStorageData();

    expect(mockedInitializeManifest).toHaveBeenCalledOnce();
    expect(mockedInitializeData).toHaveBeenCalledOnce();
  });

  it("rethrows migration errors that are not storage availability errors", async () => {
    mockedMigrateStorage.mockRejectedValue(new Error("Migration failed"));

    await expect(initializeStorageData()).rejects.toThrow("Migration failed");

    expect(mockedInitializeManifest).not.toHaveBeenCalled();
    expect(mockedInitializeData).not.toHaveBeenCalled();
  });

  it("rethrows manifest errors", async () => {
    mockedInitializeManifest.mockRejectedValue(new Error("Invalid manifest"));

    await expect(initializeStorageData()).rejects.toThrow("Invalid manifest");

    expect(mockedInitializeData).not.toHaveBeenCalled();
  });

  it("keeps local data when offline synchronization loses the storage", async () => {
    mockedSynchronizeOfflineData.mockRejectedValue(createStorageUnavailableError());

    await expect(initializeStorageData()).resolves.toBeUndefined();

    expect(mockedInitializeData).toHaveBeenCalledOnce();
    expect(mockedSynchronizeRemoteData).not.toHaveBeenCalled();
  });

  it("keeps local data when remote synchronization loses the storage", async () => {
    mockedSynchronizeRemoteData.mockRejectedValue(createStorageUnavailableError());

    await expect(initializeStorageData()).resolves.toBeUndefined();

    expect(mockedInitializeData).toHaveBeenCalledOnce();
    expect(mockedSynchronizeOfflineData).toHaveBeenCalledOnce();
  });

  it("rethrows synchronization errors that are not storage availability errors", async () => {
    mockedSynchronizeRemoteData.mockRejectedValue(new Error("Sync failed"));

    await expect(initializeStorageData()).rejects.toThrow("Sync failed");
  });
});