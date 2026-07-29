import type { Entity } from "./Entity";

export type Category = Entity & {
  name: string;
  description: string;
};