# BudgetClick 2026 - Storage Contract

## Design Principles

Storage follows these principles:

- Every object is encrypted.
- Every object is independently versioned.
- Storage is considered untrusted.
- Storage contains no plaintext user data.
- Storage objects are independent whenever possible.


# Storage Layout

```
bucket/
  manifest

  obj/
    A/
      A1bC9xY2
    B/
      BmQ8zK1a
    ...
```

The manifest is the only object with a fixed name.

All other objects use a stable, randomly generated 8-character object key.

Objects are stored under a shard determined by the first character of the object key.


# Storage Object Lifecycle

Every storage object follows the same lifecycle.

```
Storage Object

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

The manifest is the entry point into storage.

It contains:

- schema version
- manifest version
- reference object locations
- monthly chunk locations
- attachment root

The manifest is encrypted like every other storage object.


## Reference Objects

Reference objects store relatively static data.

Examples:

- accounts
- categories
- contractors

Reference objects are synchronized independently from transaction data.


## Monthly Chunks

Monthly chunks are the primary synchronization unit.

Each chunk contains:

- metadata
- transaction records

The month is determined by the manifest entry and is not duplicated inside the chunk.


## Attachments

Attachments are stored as independent encrypted objects.

Attachment object keys are referenced directly by transaction records.


# Storage Metadata

Every storage object except the manifest contains the same metadata.

Metadata includes:

- schemaVersion
- version
- createdAt
- updatedAt
- updatedBy


# Object Versioning

Every storage object has an independent version.

The version is incremented whenever the object changes.

Object versions are used for synchronization and conflict detection.


# Object Independence

Storage objects should remain independent.

Changing one object should not require rewriting unrelated objects.

Examples:

- changing categories does not rewrite monthly chunks
- changing a chunk does not rewrite reference objects
- uploading an attachment does not modify other attachments


# Future Compatibility

New functionality should introduce new storage object types whenever possible rather than extending existing ones.