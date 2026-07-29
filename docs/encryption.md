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

# Key Hierarchy

The encryption architecture uses a hierarchical key model.

```
User Passphrase
        │
        ▼
Master Key
        │
        ▼
Data Encryption Key
```

# Key Derivation

The user's passphrase is never used directly for encryption.

Instead:

```
Passphrase
      │
      ▼
PBKDF2
      │
      ▼
Master Key
      │
      ▼
Data Encryption Key
```

The MVP uses:

- PBKDF2
- SHA-256
- AES-256-GCM
- Random per-user salt

Encryption parameters are defined in `client/settings.json`.

The salt is stored separately from encrypted data and is required to derive the encryption key.

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

# Object Format

Encrypted objects are stored as raw binary.

The MVP does not use an encryption envelope.

Each encrypted object contains:

```
IV || Ciphertext || Authentication Tag
```

Encryption parameters are defined globally in `client/settings.json`.

# Randomness

Every encryption operation must use fresh cryptographic randomness.

Encryption must never produce identical ciphertext for identical plaintext.

Every encryption operation uses a fresh random initialization vector (IV).

# Object Authentication

Every encrypted object must provide integrity protection.

Object tampering must always be detected during decryption.

Objects failing authentication must never be accepted by the application.

# Compression

Compression is not part of the MVP.

The encryption pipeline is designed to allow optional compression before encryption in future versions.

# Passphrase Handling

The user provides a passphrase during setup.

The application derives encryption keys from the passphrase.

The raw passphrase is never uploaded to remote storage.

The user enters the passphrase when opening the application.

The application may optionally remember the derived encryption key locally.

The raw passphrase is never stored.

# Key Rotation

Key rotation is not part of the MVP.

Future versions may support re-encrypting all storage objects with a new master key.

# Recovery

BudgetClick has no ability to recover user data.

Recovery is possible only if the user still possesses:

- the storage location
- the correct passphrase

Loss of either makes encrypted data unrecoverable.

# Versioning

The encryption format is defined by `client/settings.json`.

Changes to the encryption format require re-encrypting all stored objects.

Encryption versioning remains independent from:

- data schema
- storage format
- synchronization

# Migration

Changes to the encryption format require storage migration.
