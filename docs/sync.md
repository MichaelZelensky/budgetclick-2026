# BudgetClick 2026 - Synchronization Specification

# Design Principles

Synchronization follows these principles:

- Offline-first.
- Remote storage is the shared source of truth.
- Synchronization occurs at object level.
- Local IndexedDB contains the working copy of remote data.
- Remote objects are identified by the remote manifest.
- Object versions determine whether local data must be updated.
- A newer remote object replaces the corresponding local object.
- Synchronization does not modify unrelated objects.
- Manual conflict resolution is a future feature.

# Synchronization Model

BudgetClick uses remote storage to synchronize data between clients.

For example:

```text
Client A

User changes data
      ↓
Save to IndexedDB
      ↓
Save encrypted object to remote storage
      ↓
Update manifest
```

Another client can then obtain the changes:

```text
Client B

Start application
      ↓
Load remote manifest
      ↓
Load local objects from IndexedDB
      ↓
Compare remote and local versions
      ↓
Download newer remote objects
      ↓
Decrypt and validate
      ↓
Update IndexedDB
      ↓
Update application state
```

Synchronization therefore allows multiple clients to share the same remote data.

# Initial Import

When setup uses existing storage, the application imports the remote data required to initialize the local database.

The import process is:

```text
Configure existing storage
      ↓
Load salt
      ↓
Derive encryption key
      ↓
Download manifest
      ↓
Decrypt and validate manifest
      ↓
Download reference data
      ↓
Download transaction data required for the initial view
      ↓
Decrypt and validate objects
      ↓
Save objects to IndexedDB
      ↓
Initialize application state
```

The initial import does not download all historical transaction data.

The manifest identifies all available transaction chunks. Only the data required for the initial transaction view is loaded.

# Initial Transaction Data

The initial setup import loads enough transaction data to provide an initial transaction view.

The MVP selection rules are:

1. Load transaction chunks from the current month and future months in chronological order.
2. Continue loading chunks until at least 100 transactions have been loaded.
3. If current and future months contain no transactions, load past months from newest to oldest.
4. Continue loading past chunks until at least 20 transactions have been loaded.
5. If fewer applicable transactions exist, load all available applicable chunks.

The application stores complete monthly chunks. It does not trim individual transactions from a downloaded chunk.

For example:

```text
Current month → future month → future month → ...
       ↓
load chunks until 100 transactions
```

If there are no current or future transactions:

```text
Previous month → previous month → previous month → ...
       ↓
load chunks until 20 transactions
```

Transaction chunks not required for the initial view remain available remotely and can be loaded when required.

# Reference Data

The following reference objects are imported during initial setup:

- accounts
- categories
- contractors

Reference objects are identified by their manifest entries.

# Transaction Chunks

Transactions are stored in monthly chunks.

The remote manifest identifies the object key and version for each chunk.

Only transaction chunks required by the current application view need to be downloaded.

Additional chunks may be downloaded when the user navigates to other periods or when synchronization requires them.

# Synchronization Flow

Synchronization uses the remote manifest to determine the latest version of each remote object.

The local manifest is not persisted as a separate IndexedDB object.

The synchronization flow is:

```text
Download remote manifest
      ↓
Load local objects from IndexedDB
      ↓
Compare remote manifest entry versions
with local object metadata versions
      ↓
Find newer remote objects
      ↓
Download required objects
      ↓
Decrypt
      ↓
Validate
      ↓
Verify object version
matches manifest entry
      ↓
Save to IndexedDB
      ↓
Update application state
      ↓
Synchronization complete
```

A local object that does not exist is treated as version `0`.

Objects that have the same version locally and remotely do not need to be downloaded again.

If the remote version is newer, the remote object replaces the local object.

The synchronization engine does not download an object when its remote manifest version is equal to or older than the local object version.

# Local Changes

Local changes are already persisted through the normal application data flow.

For example:

```text
User action
      ↓
Update IndexedDB
      ↓
Update application state
      ↓
Encrypt object
      ↓
Upload object
      ↓
Update remote manifest
```

The synchronization engine does not implement a separate local-to-remote save mechanism.

Its primary responsibility is obtaining remote changes and applying them to the local database.

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

```text
version = version + 1
```

The remote manifest stores the latest remote version for every synchronized object.

Version comparison determines whether a remote object needs to be downloaded.

For example:

```text
Local version:  3
Remote version: 3
→ No update required
```

```text
Local version:  3
Remote version: 4
→ Download remote object
→ Replace local object
```

A missing local object is treated as version `0`.

# Remote Data as Source of Truth

Remote storage is the shared source of truth between clients.

When a client starts or synchronizes, the remote manifest is used to determine whether local data is outdated.

If a remote object has a newer version, the local copy is replaced by the remote version.

The synchronization engine does not attempt to merge two different versions of an object in the MVP.

# Remote Manifest

The remote manifest is loaded and decrypted during application startup.

The decrypted manifest is stored in application state for the duration of the application session.

The manifest is not stored as a separate local IndexedDB object.

For normal synchronization, each manifest entry is compared directly with the corresponding local IndexedDB object's metadata version.

The manifest therefore acts as the authoritative index of remote object keys and remote versions.

# Conflict Handling

The MVP does not provide manual conflict resolution.

The synchronization implementation assumes that normal client synchronization produces a newer remote version that can be accepted by another client.

If stronger conflict detection is required in the future, it will be introduced as a separate synchronization feature.

# Synchronization Triggers

MVP synchronization occurs:

- during application startup
- during existing-storage setup

Future versions may add:

- manual synchronization
- network reconnect
- scheduled synchronization
- background synchronization

# Client Identifier

Each installation has a persistent `clientId`.

The client identifier is used for:

- identifying the client that made the latest change
- synchronization diagnostics
- future conflict resolution

The client identifier is not synchronized as user identity.

# Error Handling

Synchronization failures must never corrupt local data.

Typical failures include:

- network interruption
- storage unavailable
- invalid remote data
- decryption failure
- validation failure
- remote object version mismatch

A failed remote update must not replace valid local data.

The existing local object remains available when a remote object cannot be successfully downloaded, decrypted, validated, or verified against its manifest version.

A downloaded object is only saved after its contents have been successfully validated and its metadata version matches the version specified by the remote manifest.

# Future Improvements

Future versions may introduce:

- manual conflict resolution
- true optimistic concurrency
- background synchronization
- network reconnect synchronization
- synchronization queues
- retry handling
- incremental synchronization
- synchronization diagnostics
- more advanced merge strategies
