import type { Entity } from "@/types/data/Entity";

export type Contractor = Entity & {
  name: string;
  description: string;
};