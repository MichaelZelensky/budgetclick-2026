# BudgetClick 2026 - Encryption Specification

# Design Principles

The encryption system follows these principles:

- All sensitive data is encrypted locally.
- Remote storage is considered untrusted.
- The same plaintext must never rely on deterministic encryption.
- Every encrypted object is authenticated.
- Encryption is independent from storage layout.
- Encryption is independent from synchronization.

# Security Assumptions

The storage provider may:

- read every stored object
- copy every stored object
- delete every stored object
- replace stored objects
- inspect object sizes
- inspect upload timestamps

The storage provider must not be able to read application data.

Loss of the encryption key results in permanent loss of encrypted data.

# Encryption Scope

The following objects are encrypted:

- Manifest
- Reference data
- Monthly chunks
- Statistics
- Attachments

No user data is stored unencrypted.

The salt is not encrypted.

# Key Derivation

The user's passphrase is not used directly as an AES-GCM key.

PBKDF2 (Password-Based Key Derivation Function 2) derives the encryption key from the user's passphrase and salt.

The MVP uses:

- PBKDF2
- SHA-256
- 600,000 iterations
- 16-byte random salt
- 256-bit derived key

Encryption parameters are defined in `client\public\config.json`.

Example:

```json
{
  "kdf": {
    "algorithm": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 600000,
    "saltLength": 16,
    "keyLength": 256
  },
  "cipher": {
    "algorithm": "AES-GCM",
    "ivLength": 12
  }
}
```

The salt is random and generated when encryption is initialized.

The salt is not secret and may be stored unencrypted.

The salt is stored as the `salt` object in the storage root.

The salt must remain unchanged for the lifetime of the encryption key.

# Encryption Setup

On the first application launch:

- The user provides the storage path.
- The application generates a client ID.
- The user provides a passphrase.
- The application generates a random salt.
- The application derives the encryption key from the passphrase and salt.
- The application saves the salt to storage.
- The application creates and encrypts the manifest.
- The application saves the encrypted manifest to storage.
- The application persists the encryption key in the local store.
- The raw passphrase is not persisted.

The user is informed that the passphrase must not be lost.

The application may provide a one-time option during setup to print or securely save the encryption information:

- Passphrase
- Salt
- Encryption key

This information is provided as a recovery record in case the passphrase is lost.

# Application Startup

After encryption has been initialized, application startup follows this sequence:

```
Load local settings
        │
        ▼
Initialize local database
        │
        ▼
Get salt from storage
        │
        ▼
Get encryption key from local store
        │
        ▼
Decrypt manifest
        │
        ▼
Compare local and remote state
        │
        ▼
Get missing or changed data objects
```

On a new installation, the user provides the passphrase and the application derives the encryption key using the stored salt.

The manifest cannot be read or used until encryption has been initialized and the manifest has been successfully decrypted.

# Object Encryption

Every storage object follows the same pipeline.

```
Application Object
        │
        ▼
Serialize
        │
        ▼
Encrypt
        │
        ▼
Upload
```

Downloading performs the reverse operation.

```
Download
      │
      ▼
Decrypt
      │
      ▼
Deserialize
```

Encryption and decryption are performed at the storage layer so that encryption is transparent to the rest of the application.

# Object Format

Encrypted objects are stored as raw binary.

The MVP does not use an encryption envelope.

Each encrypted object contains:

```
IV || Ciphertext || Authentication Tag
```

Encryption parameters are defined in `client\public\config.json`.

# Randomness

Every encryption operation must use fresh cryptographic randomness.

Encryption must never produce identical ciphertext for identical plaintext.

Every encryption operation uses a fresh random initialization vector (IV).

The MVP uses a 12-byte IV for AES-GCM.

# Object Authentication

Every encrypted object must provide integrity protection.

Object tampering must always be detected during decryption.

Objects failing authentication must never be accepted by the application.

# Compression

Compression is not part of the MVP.

The encryption pipeline is designed to allow optional compression before encryption in future versions.

# Passphrase Handling

The user provides a passphrase during setup.

The application derives the encryption key from the passphrase and salt.

The raw passphrase is never uploaded to remote storage.

The passphrase is not persisted by the application.

The application persists the derived encryption key in the local store.

The user must retain the passphrase for recovery after reinstalling the application or using another device.

# Key Rotation

Key rotation is not part of the MVP.

Future versions may support re-encrypting all storage objects with a new encryption key.

# Recovery

BudgetClick has no ability to recover user data.

Recovery is possible only if the user still possesses:

- the storage location
- the correct passphrase

The salt is stored in the storage and does not need to be kept secret.

If the local encryption key is lost, it can be derived again using the passphrase and stored salt.

If the passphrase is lost and the local encryption key is unavailable, encrypted data is unrecoverable.

# Versioning

The encryption format is defined by `client\public\config.json`.

Changes to the encryption format require re-encrypting all stored objects.

Encryption versioning remains independent from:

- data schema
- storage format
- synchronization

# Migration

Changes to the encryption format require storage migration.
