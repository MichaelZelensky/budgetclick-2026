import type { Entity } from "./Entity";

export type Account = Entity & {
  name: string;
  description: string;
  currency: string;
  currentBalance: number;
};