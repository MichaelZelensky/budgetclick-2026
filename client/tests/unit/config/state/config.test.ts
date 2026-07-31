import { beforeEach, describe, expect, it } from "vitest";
import config from "@/../config.json";
import { initializeConfig, initializeState, getConfig } from "@/state";

describe("config state", () => {
    beforeEach(() => {
        initializeState();
    });

    it("stores immutable config", () => {
        initializeConfig(config);
        expect(getConfig()).toEqual(config);
        expect(Object.isFrozen(getConfig())).toBe(true);
    });

    it("throws before initialization", () => {
        expect(() => getConfig()).toThrow("Config has not been initialized");
    });
});