import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getState,
  initializeImmutableState,
  initializeState,
  updateChunksState,
  updateReferenceDataState,
  updateState,
} from "@/state/state";

describe("state", () => {
  beforeEach(() => {
    initializeState();
  });

  it("initializes the default state", () => {
    expect(getState()).toStrictEqual({
      config: null,
      settings: null,
      manifest: null,
      referenceData: {
        accounts: null,
        categories: null,
        contractors: null,
      },
      chunks: {},
    });
  });

  it("returns the current state", () => {
    const state = getState();

    expect(getState()).toBe(state);
  });

  it("updates a top-level state value", () => {
    const settings = { test: true };

    updateState("settings", settings);

    expect(getState().settings).toStrictEqual(settings);
  });

  it("updates reference data state", () => {
    const accounts = {
      version: 1,
      updatedBy: "test",
      updatedAt: "2026-01-01T00:00:00.000Z",
      data: [],
    };

    updateReferenceDataState("accounts", accounts);

    expect(getState().referenceData.accounts).toStrictEqual(accounts);
  });

  it("allows reference data state to be cleared", () => {
    const accounts = {
      version: 1,
      updatedBy: "test",
      updatedAt: "2026-01-01T00:00:00.000Z",
      data: [],
    };

    updateReferenceDataState("accounts", accounts);
    updateReferenceDataState("accounts", null);

    expect(getState().referenceData.accounts).toBeNull();
  });

  it("updates chunk state", () => {
    const chunk = {
      version: 1,
      updatedBy: "test",
      updatedAt: "2026-01-01T00:00:00.000Z",
      data: [],
    };

    updateChunksState("2026-01", chunk);

    expect(getState().chunks["2026-01"]).toStrictEqual(chunk);
  });

  it("initializes immutable state with a cloned and frozen value", () => {
    const value = {
      nested: {
        value: "original",
      },
    };
    const initializer = vi.fn();

    initializeImmutableState(value, initializer);

    expect(initializer).toHaveBeenCalledOnce();

    const initializedValue = initializer.mock.calls[0][0];

    expect(initializedValue).not.toBe(value);
    expect(initializedValue.nested).not.toBe(value.nested);
    expect(Object.isFrozen(initializedValue)).toBe(true);
  });

  it("does not change state when immutable state is initialized", () => {
    const stateBefore = getState();

    initializeImmutableState({ test: true }, () => undefined);

    expect(getState()).toBe(stateBefore);
  });

  it("resets all state", () => {
    initializeImmutableState({}, () => undefined);

    initializeState();

    expect(getState()).toStrictEqual({
      config: null,
      settings: null,
      manifest: null,
      referenceData: {
        accounts: null,
        categories: null,
        contractors: null,
      },
      chunks: {},
    });
  });
});