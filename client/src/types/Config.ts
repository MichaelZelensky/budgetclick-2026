import { LogLevel } from "@/types/Logger";

export type Config = {
  migrationVersion: number;
  encryptionVersion: number;
  logLevel: LogLevel;
  storage: StorageConfig;
  kdf: KdfConfig;
  cipher: CipherConfig;
};

type StorageConfig = {
  putUrl: string;
  getUrl: string;
};

type KdfConfig = {
  algorithm: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  saltLength: number;
  keyLength: number;
};

type CipherConfig = {
  algorithm: "AES-GCM";
  ivLength: number;
};