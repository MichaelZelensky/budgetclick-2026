import type { Config } from "@/types/Config";
import type { Manifest } from "@/types/storage/Manifest";
import type { Settings } from "@/types/Settings";

export type AppState = {
  config: Readonly<Config> | null;
  settings: Settings | null;
  manifest: Manifest | null;
};