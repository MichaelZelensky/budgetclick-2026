import type { Config } from "@/types/Config";

import validateConfig from "@/validators/default/Config.js";
import { initializeConfig } from "@/state";

export async function loadConfig(): Promise<void> {
    const response = await fetch("/config.json");

    if (!response.ok) {
        throw new Error(`Failed to load config.json (${response.status})`);
    }

    const config: unknown = await response.json();

    if (!validateConfig(config)) {
        const errors = validateConfig.errors
            ?.map((e) => `${e.instancePath || "/"}: ${e.message}`)
            .join("\n");

        throw new Error(`Invalid config.json\n${errors}`);
    }
    initializeConfig(config as Config);
}