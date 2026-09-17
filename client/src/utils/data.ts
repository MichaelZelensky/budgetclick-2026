import { Manifest } from "@/types/storage/Manifest";

export const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

export const decodeData = <T>(body: ArrayBuffer): T => {
  return JSON.parse(new TextDecoder().decode(body)) as T;
};