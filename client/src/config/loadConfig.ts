import type { Config } from "@/types/Config";
import validateConfig from "@/validators/default/Config.js";

export const loadConfig = async () => {
    const response = await fetch("/config.json");
    if (!response.ok) {
        throw new Error(`Failed to load config.json (${response.status})`);
    }
    const config: unknown = await response.json();
    if (!validateConfig(config)) {
        const errors = validateConfig.errors
            ?.map(x => `${x.instancePath || "/"}: ${x.message}`)
            .join("\n");
        throw new Error(`Invalid config.json\n${errors}`);
    }
    return config as Config;
};