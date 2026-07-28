# BudgetClick 2026 - Synchronization Specification

## Purpose

This document defines how BudgetClick synchronizes data between the local database and remote storage.

It specifies:

- synchronization responsibilities
- synchronization flow
- manifest lifecycle
- optimistic concurrency
- merge strategy
- conflict detection

Encryption, storage format and data schemas are specified separately.

# Design Principles

Synchronization follows these principles:

- Offline-first.
- Local database is always writable.
- Remote storage is the shared source of truth.
- Synchronization occurs at object level.
- Synchronization never blocks user interaction.
- Automatic merge whenever possible.
- Manual conflict resolution is a future feature.

# Synchronization Unit

The synchronization unit is:

```
Account + Month
```

Example:

```
chunks/
    account1/
        2026-01.chunk
        2026-02.chunk
```

Changing a record affects only one monthly chunk.

Reference data is synchronized independently.

# Synchronization Responsibilities

The synchronization engine is responsible for:

- downloading remote objects
- uploading local changes
- conflict detection
- automatic merge
- updating the manifest
- keeping local storage consistent

The synchronization engine is not responsible for:

- encryption
- migrations
- business rules

# Local Workflow

Every user action is applied immediately.

```
User Action

↓

Update Local Database

↓

Update Current Balance

↓

Mark Object Dirty

↓

Continue Working
```

The application never waits for synchronization.

# Synchronization Flow

```
Detect Dirty Objects

↓

Download Manifest

↓

Compare Versions

↓

Download Remote Objects (if needed)

↓

Merge

↓

Serialize

↓

Encrypt

↓

Upload

↓

Update Manifest

↓

Synchronization Complete
```

# Dirty Objects

A dirty object is any object that has been modified locally but has not yet been synchronized.

Examples:

- monthly chunk
- accounts
- categories
- contractors

Dirty state exists only locally.

It is never synchronized.

# Manifest

The manifest represents the current state of remote storage.

The synchronization engine downloads the manifest before every synchronization.

The manifest is used to determine:

- available objects
- object versions
- changed objects

The manifest itself is encrypted.

# Object Version

Every storage object contains a version.

Whenever an object changes:

```
version = version + 1
```

Version comparison determines whether synchronization is required.

# Optimistic Concurrency

Synchronization assumes conflicts are uncommon.

Before uploading an object:

1. Download the latest manifest.
2. Compare object versions.
3. If unchanged, upload.
4. If changed, merge first.

No object is overwritten without first checking the remote version.

# Merge Strategy

Automatic merge is the default behavior.

Whenever possible:

- independent record additions are merged
- independent record updates are merged
- independent deletions are merged

The merge algorithm operates on entities, not encrypted objects.

# Conflict Detection

A conflict exists when the same entity has been modified differently on multiple clients.

Examples:

- both clients modify the same record
- one client deletes while another modifies
- both clients modify the same category

Conflicts are detected during synchronization.

# Conflict Resolution

MVP behavior:

Attempt automatic merge.

If automatic merge is not possible:

- keep local object
- mark synchronization as conflicted
- notify the user

Future versions will provide manual conflict resolution.

# Deleted Entities

Deleted entities remain as tombstones.

Tombstones are synchronized like normal entities.

Physical removal is deferred.

# Reference Data

Reference data is synchronized independently from monthly chunks.

Updating categories should never require rewriting transaction chunks.

# Attachments

Attachments are synchronized independently.

Attachment synchronization strategy will be specified separately.

# Statistics

Statistics are synchronized as independent storage objects.

Whenever transaction data changes:

- affected statistics are recalculated
- affected statistics are synchronized

Calculation rules are specified separately.

# Synchronization Triggers

Synchronization may occur:

- manually
- application startup
- application shutdown
- network reconnect
- scheduled synchronization

Trigger strategy is implementation-specific.

# Client Identifier

Each installation has a persistent `clientId`.

The client identifier is used for:

- synchronization diagnostics
- conflict detection
- future conflict resolution

The client identifier is not synchronized as user identity.

# Error Handling

Synchronization failures must never corrupt local data.

Typical failures include:

- network interruption
- authentication failure
- storage unavailable
- object conflict
- decryption failure

Synchronization should resume safely after the failure is resolved.

# Future Improvements

Future versions may introduce:

- manual conflict resolution
- background synchronization
- incremental synchronization
- object history
- synchronization diagnostics

# Related Documents

- design.md
- storage-contract.md
- data-schema.md
- encryption.md
- migrations.md