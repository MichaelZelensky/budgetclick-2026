# BudgetClick 2026 - Encryption Specification

## Purpose

This document defines the encryption architecture used by BudgetClick.

It specifies:

- key hierarchy
- object encryption
- object envelope
- key management
- security assumptions

This document intentionally does not define:

- synchronization protocol
- storage layout
- data schemas


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

Future versions may introduce additional derived keys for:

- attachments
- shared storage
- backups

The MVP requires only one data encryption key.


# Key Derivation

The user's passphrase is never used directly for encryption.

Instead:

```
Passphrase
      │
      ▼
Key Derivation Function
      │
      ▼
Master Key
```

TODO:

- Key derivation algorithm
- Salt format
- Iteration parameters


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


# Object Envelope

Every encrypted storage object uses a common envelope.

Example:

```json
{
  "version": 1,
  "payload": "<encrypted bytes>"
}
```

The final envelope will additionally contain encryption metadata required for decryption.

TODO:

- Envelope schema
- Metadata fields
- Authentication metadata


# Randomness

Every encryption operation must use fresh cryptographic randomness.

Encryption must never produce identical ciphertext for identical plaintext.

The exact nonce strategy will be defined together with the encryption algorithm.


# Object Authentication

Every encrypted object must provide integrity protection.

Object tampering must always be detected during decryption.

Objects failing authentication must never be accepted by the application.


# Compression

Compression, if enabled, occurs before encryption.

```
Object
    │
    ▼
Serialize
    │
    ▼
Compress
    │
    ▼
Encrypt
```

Compression must never occur after encryption.

The compression algorithm is intentionally left unspecified.


# Passphrase Handling

The user provides a passphrase during setup.

The application derives encryption keys from the passphrase.

The raw passphrase must never be uploaded to remote storage.

Persistence of the passphrase or derived keys is platform-dependent and will be evaluated separately.


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

The encryption format is versioned independently from:

- data schema
- storage format
- synchronization

This allows future cryptographic improvements without redesigning the application.


# Migration

Changes to the encryption format require storage migration.

Migration procedures are defined in `migrations.md`.


# Open Decisions

The following decisions remain intentionally open until implementation:

- Key derivation algorithm
- Encryption algorithm
- Authentication algorithm
- Envelope format
- Compression algorithm
- Secure persistence strategy
- Key rotation strategy


# Related Documents

- design.md
- storage-contract.md
- sync.md
- migrations.md