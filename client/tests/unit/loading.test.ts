import { afterEach, describe, expect, it } from "vitest";
import {
  isLoading,
  setLoadingOff,
  setLoadingOn,
} from "@/state/loading";

describe("loading", () => {
  const loadingIds: string[] = [];

  afterEach(() => {
    loadingIds.forEach(setLoadingOff);
    loadingIds.length = 0;
  });

  it("sets loading on and off", () => {
    expect(isLoading.value).toBe(false);

    const loadingId = setLoadingOn();
    loadingIds.push(loadingId);

    expect(loadingId).toEqual(expect.any(String));
    expect(isLoading.value).toBe(true);

    setLoadingOff(loadingId);

    expect(isLoading.value).toBe(false);
  });

  it("stays loading while at least one loading id remains", () => {
    const firstLoadingId = setLoadingOn();
    const secondLoadingId = setLoadingOn();

    loadingIds.push(firstLoadingId, secondLoadingId);

    expect(isLoading.value).toBe(true);

    setLoadingOff(firstLoadingId);

    expect(isLoading.value).toBe(true);

    setLoadingOff(secondLoadingId);

    expect(isLoading.value).toBe(false);
  });

  it("ignores an unknown loading id without affecting active loading", () => {
    const loadingId = setLoadingOn();

    setLoadingOff("unknown-loading-id");

    expect(isLoading.value).toBe(true);

    setLoadingOff(loadingId);

    expect(isLoading.value).toBe(false);
  });
});