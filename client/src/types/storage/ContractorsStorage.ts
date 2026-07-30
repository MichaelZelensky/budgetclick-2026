import type { Contractor } from "../data/Contractor";
import type { StorageMetadata } from "./StorageMetadata";

export type ContractorsStorage = {
  metadata: StorageMetadata;
  contractors: Contractor[];
};