import { getConfig } from "@/state/config";
import { getDatabase } from "@/database";
import type { EncryptionKeyRecord } from "@/types/data/EncryptionKeyRecord";
import { getArrayBuffer } from "@/utils/buffer";

const encryptionKeyStore = "encryptionKeys";
const encryptionKeyId = "current";
let encryptionKey: CryptoKey | null = null;

const getKeyMaterial = async (passphrase: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    "raw",
    getArrayBuffer(new TextEncoder().encode(passphrase)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
};

const deriveEncryptionKey = async (
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  const keyMaterial = await getKeyMaterial(passphrase);
  const { kdf } = getConfig();
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: getArrayBuffer(salt),
      iterations: kdf.iterations,
      hash: kdf.hash,
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: kdf.keyLength,
    },
    true,
    ["encrypt", "decrypt"],
  );
};

const getStoredEncryptionKey = (): Promise<EncryptionKeyRecord | undefined> => {
  return new Promise((resolve, reject) => {
    const transaction = getDatabase().transaction(encryptionKeyStore, "readonly");
    const request = transaction.objectStore(encryptionKeyStore).get(encryptionKeyId);
    request.onsuccess = () => {
      resolve(request.result as EncryptionKeyRecord | undefined);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to load encryption key"));
    };
  });
};

const saveStoredEncryptionKey = (
  record: EncryptionKeyRecord,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = getDatabase().transaction(encryptionKeyStore, "readwrite");
    const request = transaction.objectStore(encryptionKeyStore).put(record, encryptionKeyId);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to save encryption key"));
    };
  });
};

export const hasStoredEncryptionKey = async (): Promise<boolean> => {
  return (await getStoredEncryptionKey()) !== undefined;
};

export const initializeStoredEncryptionKey = async (): Promise<boolean> => {
  const storedKey = await getStoredEncryptionKey();
  if (storedKey === undefined) {
    return false;
  }
  const keyBytes = new Uint8Array(storedKey.encryptionKey);
  const expectedKeyLength = getConfig().kdf.keyLength / 8;

  if (keyBytes.byteLength !== expectedKeyLength) {
    throw new Error("Invalid stored encryption key");
  }

  encryptionKey = await crypto.subtle.importKey(
    "raw",
    getArrayBuffer(keyBytes),
    {
      name: "AES-GCM",
      length: getConfig().kdf.keyLength,
    },
    true,
    ["encrypt", "decrypt"],
  );
  return true;
};

export const initializeEncryptionKey = async (
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  encryptionKey = await deriveEncryptionKey(passphrase, salt);
  const exportedKey = await crypto.subtle.exportKey("raw", encryptionKey);
  await saveStoredEncryptionKey({
    salt: getArrayBuffer(salt),
    encryptionKey: exportedKey,
  });
  return encryptionKey;
};

export const getEncryptionKey = (): CryptoKey => {
  if (encryptionKey === null) {
    throw new Error("Encryption key has not been initialized");
  }
  return encryptionKey;
};

export const exportEncryptionKey = async (): Promise<string> => {
  const body = await crypto.subtle.exportKey("raw", getEncryptionKey());
  return btoa(String.fromCharCode(...new Uint8Array(body)));
};