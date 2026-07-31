import { initializeState, initializeConfig } from "@/state";
import { loadConfig } from "@/config/loadConfig";
import { initializeLogger } from "@/logger";
import { LogLevel } from "@/types/Logger";

export const initializeApplication = async () => {
    initializeState();
    const config = await loadConfig();
    initializeConfig(config);

    console.log(import.meta.env);
console.log(1, import.meta.env.DEV);
console.log(2, import.meta.env.PROD);
console.log(3, import.meta.env.MODE);

    const logLevel = import.meta.env.DEV ? config.logLevel : LogLevel.Error;
    initializeLogger(logLevel);
};