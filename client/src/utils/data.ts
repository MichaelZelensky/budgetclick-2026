import { Manifest } from "@/types/storage/Manifest";

export const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

export const decodeManifest = (body: ArrayBuffer): Manifest => {
  return JSON.parse(new TextDecoder().decode(body)) as Manifest;
};