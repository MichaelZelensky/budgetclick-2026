import { beforeEach, describe, expect, it } from "vitest";
import { initializeState } from "@/state/state";
import { initializeConfig } from "@/state/modules/config";
import { getConfig } from "@/state/modules/config";

const config = {
    logLevel: "error",
};

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
        expect(() => getConfig()).toThrow("Config has not been initialized.");
    });
});