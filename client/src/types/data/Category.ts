import type { Entity } from "@/types/data/Entity";

export type Category = Entity & {
  name: string;
  description: string;
};