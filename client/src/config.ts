import type { Config } from "@/types/Config";
import validateConfig from "@/validators/default/Config.js";
import { fetchAndValidate } from "@/utils/fetch-and-validate";

export const loadConfig = async () => {
    return fetchAndValidate<Config>(`${import.meta.env.BASE_URL}config.json`, validateConfig, "config.json");
};
