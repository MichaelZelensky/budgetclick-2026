# BudgetClick 2026 - Storage Contract

## Purpose

This document defines the remote storage structure used by BudgetClick.

It specifies:

- storage layout
- storage object responsibilities
- object lifecycle
- object ownership
- versioning
- migration responsibilities

This document intentionally does not define:

- synchronization protocol
- encryption algorithms
- data schemas

Those are specified separately.


# Design Principles

Storage follows these principles:

- Every object is encrypted.
- Every object is self-describing.
- Every object is independently versioned.
- Objects are immutable between downloads and uploads.
- Storage is considered untrusted.
- Storage contains no plaintext user data.


# Storage Layout

```
bucket/
  manifest
  reference/
    accounts
    categories
    contractors
  chunks/
    <accountId>/
      <yyyy-mm>.chunk
  statistics/
    <yyyy-mm>
  attachments/
```

All objects are encrypted before upload.

Object names should be obfuscated where practical.

Whether monthly chunk names remain predictable for synchronization efficiency is intentionally left open until the synchronization protocol is finalized.


# Storage Object Lifecycle

Every storage object follows the same lifecycle.

```
Object
    ↓
Serialize
    ↓
Encrypt
    ↓
Upload
    ↓
Download
    ↓
Decrypt
    ↓
Deserialize
```

The storage layer never operates on decrypted data.


# Storage Objects

## Manifest

### Purpose

The manifest represents the current state of remote storage.

It allows the synchronization engine to determine:

- available objects
- object versions
- synchronization state

The manifest is the entry point into the storage.


### Owner

Synchronization engine.


### Update Frequency

Whenever remote storage changes.


### Contains

Initially expected to contain:

- schema version
- storage version
- reference object versions
- monthly chunk versions

Additional metadata may be introduced in future versions.


### Does Not Contain

- financial records
- attachment contents
- decrypted metadata


## Reference Objects

Reference objects store relatively static entities.

Examples:

- accounts
- categories
- contractors

Reference objects change significantly less often than transaction data.


### Owner

Core data layer.


### Update Frequency

Only when reference data changes.


### Notes

Reference data is intentionally separated from monthly transaction chunks to reduce synchronization work.


## Monthly Chunks

Monthly chunks are the primary synchronization unit.

Synchronization scope:

```
Account + Month
```

Each chunk contains the complete state for one account during one month.


### Owner

Synchronization engine.


### Update Frequency

Whenever records inside the chunk change.


### Chunk Metadata

Each chunk contains metadata describing itself.

Metadata includes:

- schemaVersion
- chunkVersion
- accountId
- month
- createdAt
- updatedAt

Chunk metadata is stored inside the chunk rather than in the manifest.

This allows chunks to be migrated independently.


### Contains

- metadata
- transaction records


### Does Not Contain

- reference entities
- statistics
- attachments


## Statistics

Statistics contain precomputed aggregated data.

Purpose:

- faster application startup
- reduced client computation
- historical summaries

Statistics are derived from transaction data.

The calculation strategy is specified separately.


### Owner

Statistics engine.


## Attachments

Attachments store binary files.

Examples:

- receipts
- invoices
- photos

Attachments are independent storage objects.

Attachment metadata is defined separately.


# Object Versioning

Every storage object is independently versioned.

Versioning supports:

- migrations
- synchronization
- backward compatibility

Version numbering is defined by the migration specification.


# Object Independence

Storage objects should remain as independent as possible.

Changing one object should not require rewriting unrelated objects.

Example:

Changing a category should not regenerate monthly chunks.

Changing a monthly chunk should not modify reference objects.


# Object Ownership

Every storage object has exactly one owning subsystem.

| Object | Owner |
|----------|-------|
| Manifest | Synchronization |
| Reference objects | Core Data |
| Monthly chunks | Synchronization |
| Statistics | Statistics |
| Attachments | Attachment subsystem |

Only the owning subsystem may modify an object.


# Naming Strategy

Object names are considered implementation details.

Goals:

- avoid exposing meaningful information
- support future storage migrations
- remain compatible with S3-compatible storage

The final naming strategy will be defined together with the synchronization protocol.


# Object Envelope

Every persisted object shares a common storage envelope.

The envelope is responsible for:

- object identification
- version information
- encryption metadata
- payload

The envelope format is defined in `encryption.md`.


# Migration

Storage migrations operate only on storage objects.

Storage migration is independent from local database migration.

Migration rules are defined in `migrations.md`.


# Future Compatibility

The storage format should support future additions without requiring redesign.

Expected future object types include:

- assets
- investment data
- banking integrations
- shared storage
- snapshots
- backups

New functionality should introduce new storage objects whenever possible rather than extending existing ones.


# Related Documents

- design.md
- data-schema.md
- sync.md
- encryption.md
- migrations.md