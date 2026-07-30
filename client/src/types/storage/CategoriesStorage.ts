import type { Category } from "../data/Category";
import type { StorageMetadata } from "./StorageMetadata";

export type CategoriesStorage = {
  metadata: StorageMetadata;
  categories: Category[];
};