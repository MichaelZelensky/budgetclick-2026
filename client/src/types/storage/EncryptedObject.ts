export type EncryptedObject = {
  version: number;
  iv: string;
  payload: string;
};