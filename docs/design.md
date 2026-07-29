# BudgetClick 2026 - Personal Finance Tracker - Design Specification

## Goals

- Offline-first personal finance application.
- Single codebase for all clients.
- Desktop + iOS + web support.
- Client-side encryption.
- User-owned storage.
- Minimum infrastructure cost.
- S3-compatible storage as the shared source of truth.
- No backend services.


# Architecture

The application is a web-based offline-first client.

Clients:

- Web browser
- iOS PWA
- Desktop browser/PWA

All clients share the same Vue.js + TypeScript codebase.

```

Vue Application
|
v
Shared Core Logic
|
+----------------+
|                |
v                v
IndexedDB        S3 Storage
(local data)     (sync source)

```


# Technology Stack

## Frontend

- Vue.js
- TypeScript
- PWA
- Browser APIs only

## Local Storage

- IndexedDB
- Local cache
- Offline operations

## Remote Storage

S3-compatible object storage.

Examples:

- AWS S3
- Cloudflare R2
- Backblaze B2
- MinIO


# Infrastructure

No:

- Backend API
- Authentication service
- Database service
- Lambda functions
- Notification services

Only storage is required.

The current priority is:

- client-side privacy
- simplicity
- cost efficiency

Future versions may introduce additional security layers if required.


# Security Model

All sensitive data is encrypted locally before upload.

Storage contains only encrypted objects.

The storage provider is considered untrusted.

All storage objects are encrypted, including:

- manifest
- reference data
- monthly chunks
- statistics
- attachments

Object names should be obfuscated where practical. Whether monthly chunk names remain predictable for synchronization efficiency will be decided in the storage specification.

TODO:

- Key derivation
- Encryption algorithm
- Object envelope format
- Key hierarchy
- Key backup/recovery

Assumption:

Loss of the encryption key means permanent data loss.

# Identity

No application authentication.

Identity is based on:

- Storage location
- Local configuration
- Encryption key

Each client installation generates a persistent `clientId`.

The `clientId` is used only for synchronization and conflict detection. It is not part of user identity.

TODO:

- User setup flow
- Recovery flow


# Data Model

The MVP focuses on personal finance tracking.

The initial model should avoid limiting future expansion into:

- asset tracking
- net worth calculation
- banking integrations
- third-party integrations
- multi-user encrypted storage
- secret storage

Initial implementation remains simple.

Future concepts should be introduced as separate entities rather than extending financial records indefinitely.


# Record

A record represents a financial event.

MVP fields:

- id
- direction
- amount
- accountId
- categoryId
- contractorId
- description
- datetime
- attachments
- isActual
- recurrencyId
- createdAt
- updatedAt

Future compatibility:

Records should remain independent from future concepts such as:

- assets
- liabilities
- valuations
- external transactions

TODO:

- Schema
- Versioning
- Deletion model (tombstone)


# Account

Represents a financial account or balance container.

Fields:

- id
- name
- description
- currency
- current balance

Future compatibility:

Accounts should not represent all possible financial assets.

Future asset tracking should introduce separate entities.

TODO:

- Schema


# Recurrency

Rules:

- Records can belong to a recurrence.
- Planned records are generated from recurrence.
- Actual records are independent.
- Recurrence changes affect planned records only.
- Records can detach from recurrence.

MVP:

- Recurrency engine is not implemented.
- Planned records are manually created using the `isActual` flag.

TODO:

- Data model
- Generation algorithm


# Identifier Strategy

Identifiers are optimized for a single-user application.

Format:

```

<type>_<8 character [azAZ09] id>

```

Examples:

```

r_Ak39LmP2
a_K92PxLq7
f_91LmQaX2

```

Rules:

- Separate namespaces per entity type.
- Custom ID generator.
- Integrity validation included.
- Collision checking performed locally.

Rationale:

- Single-user scope.
- Monthly chunk separation.
- Extremely low collision probability.


# Local Database

Local database contains:

- decrypted working data
- sync queue
- local change log
- indexes
- cached statistics

TODO:

- IndexedDB schema
- Indexes
- Migration strategy

## Migration Strategy (initial recommendation)

All stored data should contain a schema version.

Example:

```json
{
  "schemaVersion": 1,
  "data": {}
}
````

Migration rules:

* Never modify existing migrations.
* Add new migrations only.
* Apply migrations sequentially.
* Test migrations between versions.

Detailed migration strategy will be designed together with:

* data schema
* storage format
* synchronization
* encryption format

Migration consists of two independent layers:

- Local IndexedDB migration
- Remote storage migration

Both migration systems use explicit version numbers and evolve independently.

TODO:

- Backwards compatibility with saved data.


# Synchronization Model

Remote synchronization unit: month

Example:

```
chunks/
  transactions/
    2026-01.chunk -> obfuscated as c_adiuw2, mapped in the manifest
    2026-02.chunk
```

Each chunk contains the complete state for that period.

No remote operation log is stored.

Synchronization follows an optimistic concurrency model.

Whenever possible, conflicting changes are merged automatically.

Manual conflict resolution is planned for a future iteration.

Before syncronization, a manifest-temporary must be created - to recover broken synchronizations and block concurrent clients.


# Chunk Metadata

Each monthly chunk is self-describing.

Chunk metadata is stored together with the chunk rather than in the manifest.

Metadata will include:

- schema version
- chunk version
- account
- month
- createdAt
- updatedAt

Keeping metadata inside the chunk allows every chunk to be migrated independently from the manifest.


# Local Change Log

Each client maintains a local-only change log.

Purpose:

* track local modifications
* prepare chunk regeneration
* support sync workflow

The change log is not synchronized to S3.


# Sync Flow

```
User action
|
v
Local database
|
v
Local change log
|
v
Regenerate affected chunk
|
v
Encrypt
|
v
Upload encrypted S3 object
```

TODO:

* Upload flow
* Download flow
* Optimistic concurrency
* Automatic merge strategy
* Manifest update lifecycle


# Statistics

Monthly precomputed statistics.

Stored encrypted.

TODO:

* Calculation rules
* Storage format
* Refresh strategy


# Attachments

Attachments are encrypted before upload.

TODO:

* Storage format
* Metadata
* Deduplication


# Client Structure

The project uses a simple modular structure.

The initial implementation can be a single Vue application with clear internal modules.

```
BudgetClick 2.0

src/
  app/
    Vue application
    pages
    routing
  core/
    data models
    business rules
    record management
    recurrence logic
    statistics logic
  sync/
    synchronization engine
    change tracking
    conflict handling
  encryption/
    key management
    encrypt/decrypt operations
  storage/
    IndexedDB adapter
    S3 adapter
  components/
    shared Vue components
    forms
    tables
    layouts
```


# Testing Strategy

Testing is defined at the end of each development iteration.

Testing is performed on each build.

## Automated Tests

Cover:

* encryption/decryption
* ID generation
* data serialization
* migrations
* sync logic
* storage adapters

## User Scenario Tests

Validate real workflows.

Examples:

* Create records offline and sync later.
* Modify data on multiple devices.
* Restore data from storage.
* Recover from application restart.


# Non Goals

The initial version will not include:

* User accounts managed by BudgetClick.
* Cloud storage managed by BudgetClick.
* Banking integrations.
* Server-side analytics.
* Multi-user collaboration.
* Shared wallets.
* Social features.

# Clients

## iOS PWA

Uses the same web application.

Capabilities:

* Offline operation.
* IndexedDB storage.
* Web Crypto API.
* Direct S3 sync.

Limitations:

* No reliable background execution.
* Browser storage lifecycle limitations.


TODO:

- Verify that the PWA behaves like a standalone application on iOS.
- Verify persistence of IndexedDB.
- Verify persistence of local configuration.
- Evaluate secure persistence of the encryption key/passphrase.


## Desktop

Uses the same web application.

Initial target:

* Browser/PWA.

No native wrapper.


# Future Domain Compatibility

The initial application focuses on personal finance tracking.

The design should avoid blocking future features:

* asset tracking
* net worth calculation
* banking integrations
* third-party integrations
* multi-user encrypted storage
* secret storage

Principles:

* Keep financial events separate from financial entities.
* Avoid making expense records the only financial object.
* Keep storage formats extensible.
* Keep external integrations abstract.
* Avoid hard dependency on single-user assumptions in core models.

Future features are not part of MVP implementation.


# Future Improvements

* Optional private storage mode.
* Better conflict resolution.
* Version history.
* Backup snapshots.
* Multi-user support.
* Storage version history.
* Key rotation.
