import { initializeState, initializeConfig } from "@/state";
import { loadConfig } from "@/config/loadConfig";

export const initializeApplication = async () => {
    initializeState();
    const config = await loadConfig();
    initializeConfig(config);
};