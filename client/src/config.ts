import type { Config } from "@/types/Config";
import validateConfig from "@/validators/default/Config.js";
import { fetchAndValidate } from "@/utils/fetch-and-validate";

export const loadConfig = async () => {
    return fetchAndValidate<Config>("/config.json", validateConfig, "config.json");
};
