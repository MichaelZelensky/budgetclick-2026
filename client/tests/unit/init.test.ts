import { beforeEach, describe, expect, it, vi } from "vitest";
import config from "@/../config.json";
import { initializeApplication } from "@/init";
import { getConfig, getState, initializeState } from "@/state";

describe("application initialization", () => {
    beforeEach(() => {
        initializeState();

        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => structuredClone(config),
        }));
    });

    it("initializes config state", async () => {
        await initializeApplication();

        expect(getState().config).toEqual(config);
        expect(getState().config).toBe(getConfig());

        expect(getConfig()).toEqual(config);
        expect(Object.isFrozen(getConfig())).toBe(true);
    });
});