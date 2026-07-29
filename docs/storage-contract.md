# BudgetClick 2026 - Storage Contract

## Design Principles

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
    accounts  -> obfuscated as kakaoi3, mapped in manifest
    categories -> obfuscated as adsadsla32, mapped in manifest
    contractors  -> obfuscated as uqfj8u3, mapped in manifest
  chunks/
    <yyyy-mm>.chunk  -> obfuscated as c_a3f32, mapped in manifest
  statistics/
    <yyyy-mm> -> obfuscated as s_adsla32, mapped in manifest
  attachments/
		attachments-map -> obfuscated as vaknqo988, mapped in manifest
    sharded/ -> obfuscated as afdi23, mapped in manifest
			attachement_name -> obfuscated as s_adsla32, mapped in attachments-map (?)
```

All objects are encrypted before upload.

Object names should be obfuscated where practical.

Whether monthly chunk names remain predictable for synchronization efficiency is intentionally left open until the synchronization protocol is finalized.

TODO:
- think about attachment mapping. Maybe mapping in record will be enough. Do we also need to keep the attachment meta, e.g. original filename, etc? -> probably storing the obfuscated file name for MVP is enough.


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


### Contains

Initially expected to contain:

- schema version
- storage version
- reference object versions
- monthly chunk versions

Additional metadata may be introduced in future versions.


## Reference Objects

Reference objects store relatively static entities.

Examples:

- accounts
- categories
- contractors

Reference objects change significantly less often than transaction data.


### Notes

Reference data is intentionally separated from monthly transaction chunks to reduce synchronization work.


## Monthly Chunks

Monthly chunks are the primary synchronization unit.

Each chunk contains the complete state for all accounts during one month.



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


## Statistics

Statistics contain precomputed aggregated data.

Purpose:

- faster application startup
- reduced client computation
- historical summaries

Statistics are derived from transaction data.

The calculation strategy is specified separately.

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
