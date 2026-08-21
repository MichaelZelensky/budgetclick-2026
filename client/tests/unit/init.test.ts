import { beforeEach, describe, expect, it, vi } from "vitest";

import config from "@/../public/config.json";
import settings from "@/../public/settings.json";
import { initializeApplication } from "@/init";
import { getState, initializeState } from "@/state";

describe("application initialization", () => {
  beforeEach(() => {
    initializeState();
    localStorage.clear();

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

  it("does not load manifest when storage is not configured", async () => {
    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "-",
        clientId: "-",
      }),
    );

    await initializeApplication();

    expect(getState().manifest).toBeNull();
  });

  it("attempts to load manifest when storage is configured", async () => {
    localStorage.setItem(
      "budgetclick.settings",
      JSON.stringify({
        schemaVersion: 1,
        storage: "test-storage",
        clientId: "client-123",
      }),
    );

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => structuredClone(config),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        arrayBuffer: async () => new ArrayBuffer(0),
      });

    vi.stubGlobal("fetch", fetchMock);

    await initializeApplication();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getState().config).toEqual(config);
    expect(getState().manifest).toBeNull();
  });
});