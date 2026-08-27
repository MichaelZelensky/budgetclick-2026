import { getConfig } from "@/state/config";
import { getRawFile, putRawFile } from "@/storage";

const saltKey = "salt";

export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(getConfig().kdf.saltLength));
};

export const loadSalt = async (): Promise<Uint8Array | null> => {
  const body = await getRawFile(saltKey);
  return body === null ? null : new Uint8Array(body);
};

export const saveSalt = async (salt: Uint8Array): Promise<void> => {
  await putRawFile(saltKey, salt);
};

export const encodeBytes = (bytes: Uint8Array): string => {
  let value = "";
  bytes.forEach(x => {
    value += String.fromCharCode(x);
  });
  return btoa(value);
};