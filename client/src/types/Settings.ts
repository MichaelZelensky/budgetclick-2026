export type Settings = {
  migrationVersion: number;
  encryptionVersion: number;
  kdf: KdfSettings;
  cipher: CipherSettings;
};

export type KdfSettings = {
  algorithm: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  saltLength: number;
  keyLength: number;
};

export type CipherSettings = {
  algorithm: "AES-GCM";
  ivLength: number;
};