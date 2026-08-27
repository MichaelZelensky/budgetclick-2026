import { getConfig } from "@/state/config";
import { getEncryptionKey } from "@/encryption/key";
import { getArrayBuffer } from "@/utils/buffer";

const getEncryptionAlgorithm = (iv: Uint8Array): AesGcmParams => {
  return {
    name: getConfig().cipher.algorithm,
    iv: getArrayBuffer(iv),
  };
};

export const encryptData = async (body: Uint8Array): Promise<Uint8Array> => {
  const iv = crypto.getRandomValues(new Uint8Array(getConfig().cipher.ivLength));
  const encrypted = await crypto.subtle.encrypt(getEncryptionAlgorithm(iv), getEncryptionKey(), getArrayBuffer(body));
  const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.byteLength);
  return result;
};

export const decryptData = async (body: ArrayBuffer): Promise<ArrayBuffer> => {
  const ivLength = getConfig().cipher.ivLength;
  if (body.byteLength < ivLength) {
    throw new Error("Invalid encrypted object");
  }
  const bytes = new Uint8Array(body);
  const iv = bytes.slice(0, ivLength);
  const ciphertext = bytes.slice(ivLength);
  return crypto.subtle.decrypt(getEncryptionAlgorithm(iv), getEncryptionKey(), ciphertext);
};