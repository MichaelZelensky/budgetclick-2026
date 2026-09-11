# BudgetClick 2026 - Encryption Specification

# Design Principles

All sensitive data is encrypted locally; remote storage is untrusted. No deterministic encryption; every object is authenticated; encryption is independent of storage layout and sync.

# Security Assumptions

The storage provider can read, copy, delete, replace objects and see sizes/timestamps — but must never read application data. Losing the encryption key means permanent data loss.

# Encryption Scope

Encrypted: manifest, reference data, monthly chunks, statistics, attachments. Nothing is stored unencrypted except the salt.

# Key Derivation

PBKDF2 derives the AES-GCM key from the user's passphrase and salt (never used directly).

MVP parameters (`client\public\config.json`):

```json
{
  "kdf": { "algorithm": "PBKDF2", "hash": "SHA-256", "iterations": 600000, "saltLength": 16, "keyLength": 256 },
  "cipher": { "algorithm": "AES-GCM", "ivLength": 12 }
}
```

The salt is random, generated once at setup, stored unencrypted in the root as `salt`, and must never change for the life of the key.

# Encryption Setup

On first launch: user provides storage path → app generates `clientId` → user provides passphrase → app generates salt → derives key → saves salt to storage → creates and encrypts the manifest → saves it → persists the derived key locally (not the raw passphrase). The user is warned not to lose the passphrase; setup may optionally offer a one-time printable/saveable recovery record (passphrase, salt, key).

# Application Startup

```
Load settings → Init local DB → Get salt from storage → Get key from local store
   → Decrypt manifest → Compare local/remote state → Fetch missing/changed objects
```

On a new install, the passphrase plus stored salt re-derive the key. The manifest is unusable until decrypted.

# Object Encryption Pipeline

Upload: Serialize → Encrypt → Upload. Download: Download → Decrypt → Deserialize. Handled transparently at the storage layer.

# Object Format

Raw binary, no envelope: `IV || Ciphertext || Authentication Tag`. Parameters in `client\public\config.json`.

# Randomness & Authentication

Every encryption uses a fresh 12-byte IV (AES-GCM) — identical plaintext must never produce identical ciphertext. Every object is authenticated; tampered objects must fail decryption and be rejected.

# Compression

Not part of MVP; the pipeline allows optional compression before encryption later.

# Passphrase Handling

The passphrase is provided once, used to derive the key, never uploaded or persisted. Only the derived key is persisted locally. The user must retain the passphrase to recover access on reinstall or a new device.

# Key Rotation

Not part of MVP; future versions may re-encrypt all objects with a new key.

# Recovery

BudgetClick cannot recover data. Recovery requires the storage location and the correct passphrase (to re-derive the key using the public salt). If both the local key and the passphrase are lost, data is unrecoverable.

# Versioning & Migration

Encryption format is defined by `config.json` and versioned independently of data schema, storage format, and sync. Format changes require re-encrypting all objects via storage migration.