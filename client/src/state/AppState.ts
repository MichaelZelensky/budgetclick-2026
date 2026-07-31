import type { Config } from "@/types/Config";

export type AppState = {
    config: Readonly<Config> | null;
};