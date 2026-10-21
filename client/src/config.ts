import type { Config } from "@/types/Config";
import validateConfig from "@/validators/default/Config.js";
import { fetchAndValidate } from "@/utils/fetch-and-validate";

const configStorageKey = "budgetclick.config";

export const loadConfig = async (): Promise<Config> => {
  try {
    const config = await fetchAndValidate<Config>(`${import.meta.env.BASE_URL}config.json`, validateConfig, "config.json");
    localStorage.setItem(configStorageKey, JSON.stringify(config));
    return config;
  } catch (error) {
    if (!(error instanceof TypeError && error.message === "Failed to fetch")) {
      throw error;
    }
    const storedConfig = localStorage.getItem(configStorageKey);
    if (storedConfig === null) {
      throw error;
    }
    const config: unknown = JSON.parse(storedConfig);
    if (!validateConfig(config)) {
      throw new Error("Invalid stored config");
    }
    return config;
  }
};