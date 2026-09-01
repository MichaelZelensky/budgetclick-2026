import { beforeEach, describe, expect, it } from "vitest";
import {
  getSetupState,
  resetSetupState,
} from "@/state/setup";

describe("setup state", () => {
  beforeEach(() => {
    resetSetupState();
  });

  it("initializes the default setup state", () => {
    expect(getSetupState()).toEqual({
      storageMode: null,
      remoteSalt: null,
      remoteManifest: null,
      recoveryPassphrase: "",
      recoverySalt: "",
    });
  });

  it("returns the current setup state", () => {
    const state = getSetupState();

    expect(getSetupState()).toBe(state);
  });

  it("resets all setup state", () => {
    const state = getSetupState();

    state.storageMode = "existing";
    state.remoteSalt = new Uint8Array([1, 2, 3]);
    state.remoteManifest = new ArrayBuffer(8);
    state.recoveryPassphrase = "passphrase";
    state.recoverySalt = "salt";

    resetSetupState();

    expect(getSetupState()).toEqual({
      storageMode: null,
      remoteSalt: null,
      remoteManifest: null,
      recoveryPassphrase: "",
      recoverySalt: "",
    });
  });

  it("clears remote salt when resetting", () => {
    const state = getSetupState();

    state.remoteSalt = new Uint8Array([1, 2, 3]);

    resetSetupState();

    expect(getSetupState().remoteSalt).toBeNull();
  });

  it("clears remote manifest when resetting", () => {
    const state = getSetupState();

    state.remoteManifest = new ArrayBuffer(8);

    resetSetupState();

    expect(getSetupState().remoteManifest).toBeNull();
  });
});