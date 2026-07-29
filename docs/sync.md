# BudgetClick 2026 - Synchronization Specification

# Design Principles

Synchronization follows these principles:

- Offline-first.
- Local database is always writable.
- Remote storage is the shared source of truth.
- Synchronization occurs at object level.
- Synchronization never blocks user interaction.
- Automatic merge whenever possible.
- Manual conflict resolution is a future feature.

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

For Each Dirty Object

↓

Download Manifest

↓

Compare Object Version

↓

Download Remote Object (if needed)

↓

Merge

↓

Serialize

↓

Encrypt

↓

Upload Object

↓

Update Manifest

↓

Next Dirty Object

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

The synchronization engine downloads the manifest before synchronizing each dirty object.

The manifest is used to determine:

- object locations
- object versions

The manifest itself is encrypted.

# Object Keys

Every synchronized object has a stable, randomly generated storage object key.

The object key:

- is generated when the object is created
- never changes
- is stored in the manifest
- obfuscates storage object names

Objects are overwritten in place using their stable object key.

# Object Version

Every synchronized object contains a version.

Whenever an object changes:

```
version = version + 1
```

The manifest stores the latest synchronized version for every object.

Version comparison determines whether synchronization or merging is required.

# Optimistic Concurrency

Synchronization assumes conflicts are uncommon.

Before synchronizing a dirty object:

1. Download the latest manifest.
2. Compare the remote object version with the local base version.
3. If the versions match, upload the local object.
4. If the remote version is newer, download the remote object and merge.
5. Upload the merged object.
6. Update the manifest.

If another client updates the manifest before it can be uploaded, synchronization of the current object is repeated using the latest manifest.

Objects are synchronized independently.

A conflict affecting one object does not prevent synchronization of other objects.

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

Synchronization resumes safely after the failure is resolved.

# Future Improvements

Future versions may introduce:

- manual conflict resolution
- background synchronization
- incremental synchronization
- synchronization diagnostics
