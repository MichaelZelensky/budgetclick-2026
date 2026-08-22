import type { Entity } from "@/types/data/Entity";

export type Account = Entity & {
  name: string;
  description: string;
  currency: string;
  currentBalance: number;
};