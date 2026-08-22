import type { Contractor } from "@/types/data/Contractor";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type ContractorsStorage = {
  metadata: StorageMetadata;
  contractors: Contractor[];
};