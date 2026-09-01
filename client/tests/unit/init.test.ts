import { beforeEach, describe, expect, it, vi } from "vitest";

import config from "@/../public/config.json";
import settings from "@/../public/settings.json";
import { initializeApplication } from "@/init";
import { getState, initializeState } from "@/state/state";
import { initializeDatabase } from "@/database";
import { initializeStoredEncryptionKey } from "@/encryption/key";
import { initializeManifest } from "@/manifest";
import { initializeData } from "@/repository/data";

vi.mock("@/database", () => ({
  initializeDatabase: vi.fn(),
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

const mockedInitializeDatabase = vi.mocked(initializeDatabase);
const mockedInitializeStoredEncryptionKey = vi.mocked(initializeStoredEncryptionKey);
const mockedInitializeManifest = vi.mocked(initializeManifest);
const mockedInitializeData = vi.mocked(initializeData);

describe("application initialization", () => {
  beforeEach(() => {
    initializeState();
    localStorage.clear();

    mockedInitializeDatabase.mockReset();
    mockedInitializeStoredEncryptionKey.mockReset();
    mockedInitializeManifest.mockReset();
    mockedInitializeData.mockReset();

    mockedInitializeStoredEncryptionKey.mockResolvedValue(true);
    mockedInitializeManifest.mockResolvedValue(false);

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => structuredClone(config),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => structuredClone(settings),
        }),
    );
  });

  it("initializes config and settings", async () => {
    await initializeApplication();

    expect(getState().config).toEqual(config);
    expect(getState().settings).toEqual(settings);
    expect(getState().manifest).toBeNull();
  });

  it("initializes the database", async () => {
    await initializeApplication();

    expect(mockedInitializeDatabase).toHaveBeenCalledOnce();
  });

  it("does not initialize encryption when storage is not configured", async () => {
    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "-",
        clientId: "-",
      }),
    );

    await initializeApplication();

    expect(mockedInitializeStoredEncryptionKey).not.toHaveBeenCalled();
    expect(mockedInitializeManifest).not.toHaveBeenCalled();
    expect(mockedInitializeData).not.toHaveBeenCalled();
    expect(getState().manifest).toBeNull();
  });

  it("does not initialize encryption when client id is not configured", async () => {
    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "test-storage",
        clientId: "-",
      }),
    );

    await initializeApplication();

    expect(mockedInitializeStoredEncryptionKey).not.toHaveBeenCalled();
    expect(mockedInitializeManifest).not.toHaveBeenCalled();
    expect(mockedInitializeData).not.toHaveBeenCalled();
  });

  it("does not initialize manifest when encryption key is unavailable", async () => {
    mockedInitializeStoredEncryptionKey.mockResolvedValue(false);

    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "test-storage",
        clientId: "client-123",
      }),
    );

    await initializeApplication();

    expect(mockedInitializeStoredEncryptionKey).toHaveBeenCalledOnce();
    expect(mockedInitializeManifest).not.toHaveBeenCalled();
    expect(mockedInitializeData).not.toHaveBeenCalled();
  });

  it("initializes encryption before loading the manifest", async () => {
    mockedInitializeManifest.mockResolvedValue(false);

    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "test-storage",
        clientId: "client-123",
      }),
    );

    await initializeApplication();

    expect(mockedInitializeStoredEncryptionKey).toHaveBeenCalledOnce();
    expect(mockedInitializeManifest).toHaveBeenCalledOnce();

    expect(
      mockedInitializeStoredEncryptionKey.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mockedInitializeManifest.mock.invocationCallOrder[0],
    );
  });

  it("initializes data when manifest is initialized", async () => {
    mockedInitializeManifest.mockResolvedValue(true);

    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "test-storage",
        clientId: "client-123",
      }),
    );

    await initializeApplication();

    expect(mockedInitializeStoredEncryptionKey).toHaveBeenCalledOnce();
    expect(mockedInitializeManifest).toHaveBeenCalledOnce();
    expect(mockedInitializeData).toHaveBeenCalledOnce();
  });

  it("does not initialize data when manifest is not initialized", async () => {
    mockedInitializeManifest.mockResolvedValue(false);

    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "test-storage",
        clientId: "client-123",
      }),
    );

    await initializeApplication();

    expect(mockedInitializeManifest).toHaveBeenCalledOnce();
    expect(mockedInitializeData).not.toHaveBeenCalled();
  });
});
