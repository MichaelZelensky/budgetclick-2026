import { getConfig } from "@/state/config";
import { getSettings } from "@/state/settings";
import { decryptData, encryptData } from "@/encryption/encryption";
import { getArrayBuffer } from "@/utils/buffer";

export type FileNotFoundError = Error & { name: "FileNotFoundError" };

export const createFileNotFoundError = (key: string): FileNotFoundError => {
  const error = new Error(`File not found: ${key}`) as FileNotFoundError;
  error.name = "FileNotFoundError";
  return error;
};

export const isFileNotFoundError = (error: unknown): error is FileNotFoundError => {
  return error instanceof Error && error.name === "FileNotFoundError";
};

const getStoragePath = (): string => {
  return getSettings().storage;
};

const getGetUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/get" : getConfig().storage.getUrl;
};

const getPutUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/put" : getConfig().storage.putUrl;
};

const getStorageKey = (key: string): string => {
  return key === "manifest" || key === "salt" ? key : `${key[0]}/${key}`;
};

export const getRawFile = async (key: string): Promise<ArrayBuffer | null> => {
  const response = await fetch(getGetUrl(), {
    method: "GET",
    headers: {
      "X-Storage-Path": getStoragePath(),
      "X-Storage-Key": getStorageKey(key),
    },
    cache: "no-store",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to get file (${response.status})`);
  }
  return response.arrayBuffer();
};

export const putRawFile = async (key: string, body: Uint8Array): Promise<void> => {
  const response = await fetch(getPutUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Storage-Path": getStoragePath(),
      "X-Storage-Key": getStorageKey(key),
    },
    body: getArrayBuffer(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to put file (${response.status})`);
  }
};

export const getFile = async (key: string): Promise<ArrayBuffer> => {
  const body = await getRawFile(key);
  if (body === null) {
    throw createFileNotFoundError(key);
  }
  return decryptData(body);
};

export const putFile = async (key: string, body: Uint8Array): Promise<void> => {
  await putRawFile(key, await encryptData(body));
};