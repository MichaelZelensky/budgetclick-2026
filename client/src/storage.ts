import { getConfig } from "@/state/config";
import { getSettings } from "@/state/settings";
import { decryptData, encryptData } from "@/encryption/encryption";
import { getArrayBuffer } from "@/utils/buffer";
import { logger } from "@/logger";

export type FileNotFoundError = Error & { name: "FileNotFoundError" };

export const createFileNotFoundError = (key: string): FileNotFoundError => {
  const error = new Error(`File not found: ${key}`) as FileNotFoundError;
  error.name = "FileNotFoundError";
  return error;
};

export const isFileNotFoundError = (error: unknown): error is FileNotFoundError => {
  return error instanceof Error && error.name === "FileNotFoundError";
};

export type FileTooLargeError = Error & { name: "FileTooLargeError" };

export const createFileTooLargeError = (key: string): FileTooLargeError => {
  const error = new Error(`File too large: ${key}`) as FileTooLargeError;
  error.name = "FileTooLargeError";
  return error;
};

export const isFileTooLargeError = (error: unknown): error is FileTooLargeError => {
  return error instanceof Error && error.name === "FileTooLargeError";
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const getStoragePath = (): string => {
  return getSettings().storage;
};

const getGetUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/get" : getConfig().storage.getUrl;
};

const getPutUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/put" : getConfig().storage.putUrl;
};

const getListUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/list" : getConfig().storage.listUrl;
};

const getDeleteUrl = (): string => {
  return import.meta.env.DEV ? "http://localhost:3000/delete" : getConfig().storage.deleteUrl;
};

const getStorageKey = (key: string): string => {
  return key === "manifest" || key === "salt" ? key : `${key[0]}/${key}`;
};

/** Inverse of getStorageKey: "A/A1bC9xY2" -> "A1bC9xY2"; "manifest" and "salt" are unchanged. */
const fromStorageKey = (storageKey: string): string => {
  const match = /^[^/]\/(.+)$/.exec(storageKey);
  return match ? match[1] : storageKey;
};

/**
 * Direct mode talks to the S3-compatible bucket from the browser (requires bucket CORS).
 * Dev always uses the local storage server.
 */
const isDirect = (): boolean => {
  return !import.meta.env.DEV && getConfig().storage.mode === "direct";
};

const getBaseUrl = (): string => {
  const path = getStoragePath();
  return path.endsWith("/") ? path : `${path}/`;
};

const getObjectUrl = (key: string): string => {
  return (
    getBaseUrl() +
    getStorageKey(key)
      .split("/")
      .map(encodeURIComponent)
      .join("/")
  );
};

const directFetch = async (url: string, init: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Storage request failed. Check the bucket CORS settings and the storage path.");
    }
    throw error;
  }
};

export const getRawFile = async (key: string): Promise<ArrayBuffer | null> => {
  const response = isDirect()
    ? await directFetch(getObjectUrl(key), { method: "GET", cache: "no-store" })
    : await fetch(getGetUrl(), {
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
  if (body.byteLength > MAX_FILE_SIZE) {
    throw createFileTooLargeError(key);
  }
  const response = isDirect()
    ? await directFetch(getObjectUrl(key), {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: getArrayBuffer(body),
      })
    : await fetch(getPutUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Storage-Path": getStoragePath(),
          "X-Storage-Key": getStorageKey(key),
        },
        body: getArrayBuffer(body),
      });
  if (response.status === 413) {
    throw createFileTooLargeError(key);
  }
  if (!response.ok) {
    throw new Error(`Failed to put file (${response.status})`);
  }
};

const listDirectFiles = async (): Promise<string[]> => {
  const keys: string[] = [];
  let token: string | null = null;
  do {
    const url = new URL(getBaseUrl());
    url.searchParams.set("list-type", "2");
    if (token) {
      url.searchParams.set("continuation-token", token);
    }
    const response = await directFetch(url.toString(), { method: "GET", cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to list files (${response.status})`);
    }
    const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
    xml.querySelectorAll("Contents > Key").forEach((element) => {
      if (element.textContent) {
        keys.push(fromStorageKey(element.textContent));
      }
    });
    token =
      xml.querySelector("IsTruncated")?.textContent === "true"
        ? (xml.querySelector("NextContinuationToken")?.textContent ?? null)
        : null;
  } while (token);
  return keys;
};

export const listRawFiles = async (): Promise<string[]> => {
  if (isDirect()) {
    return listDirectFiles();
  }
  const response = await fetch(getListUrl(), {
    method: "GET",
    headers: {
      "X-Storage-Path": getStoragePath(),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to list files (${response.status})`);
  }
  return response.json();
};

export const removeRawFile = async (key: string): Promise<void> => {
  const response = isDirect()
    ? await directFetch(getObjectUrl(key), { method: "DELETE" })
    : await fetch(getDeleteUrl(), {
        method: "DELETE",
        headers: {
          "X-Storage-Path": getStoragePath(),
          "X-Storage-Key": getStorageKey(key),
        },
      });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete file (${response.status})`);
  }
};

export const getFile = async (key: string): Promise<ArrayBuffer> => {
  logger.debug(`Getting file: ${key}`);
  const body = await getRawFile(key);
  if (body === null) {
    throw createFileNotFoundError(key);
  }
  const decrypted = await decryptData(body);
  return decrypted;
};

export const putFile = async (key: string, body: Uint8Array): Promise<void> => {
  logger.debug(`Putting file: ${key}`);
  await putRawFile(key, await encryptData(body));
};

export const deleteFile = async (key: string): Promise<void> => {
  logger.debug(`Deleting file: ${key}`);
  await removeRawFile(key);
};