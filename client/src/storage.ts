import { getConfig, getSettings } from "@/state";

const getStoragePath = (): string => {
  return getSettings().storage;
};

const getGetUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/get" : getConfig().storage.getUrl;
};

const getPutUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/put" : getConfig().storage.putUrl;
};

const getArrayBuffer = (body: Uint8Array): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(body.byteLength);
  new Uint8Array(arrayBuffer).set(body);
  return arrayBuffer;
};

export const getFile = async (key: string): Promise<ArrayBuffer> => {
  const response = await fetch(getGetUrl(), {
    method: "GET",
    headers: {
      "X-Storage-Path": getStoragePath(),
      "X-Storage-Key": key,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to get file (${response.status})`);
  }
  return response.arrayBuffer();
};

export const putFile = async (key: string, body: Uint8Array): Promise<void> => {
  const response = await fetch(getPutUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Storage-Path": getStoragePath(),
      "X-Storage-Key": key,
    },
    body: getArrayBuffer(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to put file (${response.status})`);
  }
};