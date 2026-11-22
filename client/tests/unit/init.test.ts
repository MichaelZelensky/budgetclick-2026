import { beforeEach, describe, expect, it, vi } from "vitest";

import config from "@/../public/config.json";
import settings from "@/../public/settings.json";
import { initializeApplication } from "@/init";
import { getState, initializeState } from "@/state/state";
import { initializeDatabase } from "@/database";
import { initializeOfflineSync } from "@/offline-sync";
import { initializeStorageData } from "@/init-storage";

vi.mock("@/database", () => ({
  initializeDatabase: vi.fn(),
}));

vi.mock("@/offline-sync", () => ({
  initializeOfflineSync: vi.fn(),
}));

vi.mock("@/init-storage", () => ({
  initializeStorageData: vi.fn(),
}));

const mockedInitializeDatabase = vi.mocked(initializeDatabase);
const mockedInitializeOfflineSync = vi.mocked(initializeOfflineSync);
const mockedInitializeStorageData = vi.mocked(initializeStorageData);

describe("application initialization", () => {
  beforeEach(() => {
    initializeState();
    localStorage.clear();

    mockedInitializeDatabase.mockReset();
    mockedInitializeOfflineSync.mockReset();
    mockedInitializeStorageData.mockReset();

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

  it("initializes offline sync after the database", async () => {
    await initializeApplication();

    expect(mockedInitializeOfflineSync).toHaveBeenCalledOnce();
    expect(mockedInitializeDatabase.mock.invocationCallOrder[0])
      .toBeLessThan(mockedInitializeOfflineSync.mock.invocationCallOrder[0]);
  });

  it("initializes storage data after offline sync", async () => {
    await initializeApplication();

    expect(mockedInitializeStorageData).toHaveBeenCalledOnce();
    expect(mockedInitializeOfflineSync.mock.invocationCallOrder[0])
      .toBeLessThan(mockedInitializeStorageData.mock.invocationCallOrder[0]);
  });

  it("propagates storage initialization errors", async () => {
    mockedInitializeStorageData.mockRejectedValue(new Error("boom"));

    await expect(initializeApplication()).rejects.toThrow("boom");
  });
});