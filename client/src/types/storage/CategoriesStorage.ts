import type { Category } from "@/types/data/Category";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type CategoriesStorage = {
  metadata: StorageMetadata;
  categories: Category[];
};