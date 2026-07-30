export type Config = {
  migrationVersion: number;
  encryptionVersion: number;
  kdf: KdfConfig;
  cipher: CipherConfig;
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