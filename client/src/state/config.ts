import type { Config } from "@/types/Config";

import { getState, initializeImmutableState } from "@/state/state";

export function initializeConfig(config: Config): void {
    initializeImmutableState(config, (value) => {
        getState().config = value;
    });
}

export function getConfig(): Readonly<Config> {
    const config = getState().config;

    if (config === null) {
        throw new Error("Config has not been initialized.");
    }

    return config;
}