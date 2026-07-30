import type { Entity } from "./Entity";

export type Contractor = Entity & {
  name: string;
  description: string;
};