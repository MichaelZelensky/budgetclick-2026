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

---

# Architecture

## Overview

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

---

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

---

# Infrastructure

## Principles

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

---

# Security Model

## Encryption

All sensitive data is encrypted locally before upload.

Storage contains only encrypted objects.

TODO:

- Key derivation
- Encryption algorithm
- File format
- Key backup/recovery

Assumption:

Loss of encryption key means permanent data loss.

---

# Identity

No application authentication.

Identity is based on:

- Storage location
- Local configuration
- Encryption key

TODO:

- User setup flow
- Recovery flow

---

# Storage Layout

```

bucket/

manifest.json

reference/
accounts.json
contractors.json
categories.json

chunks/ <accountId>/ <yyyy-mm>.chunk

statistics/ <yyyy-mm>.json

attachments/ <attachmentId>

```

All objects are encrypted.

Storage design principles:

- Reference data is separated from time-based transaction data.
- Monthly chunks contain operational data.
- Attachments are stored separately.
- Storage format should allow future expansion.

TODO:

- are attachments encrypted too?
- Attachment storage optimization.
- Attachment metadata format.
- Reference data versioning.


---

# Data Model

## Domain Model Principles

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

---

# Record

A record represents a financial event.

MVP fields:

- id
- in/out type
- amount
- accountId
- description
- expenseId
- contractorId
- datetime
- attachments
- isActual
- recurrencyId

Future compatibility:

Records should remain independent from future concepts such as:

- assets
- liabilities
- valuations
- external transactions

TODO:

- Schema
- Versioning
- Deletion model

---

# Account

Represents a financial account or balance container.

Fields:

- id
- name
- description
- currency
- current amount

Future compatibility:

Accounts should not represent all possible financial assets.

Future asset tracking should introduce separate entities.

TODO:

- Schema

---

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

---

# Identifier Strategy

Identifiers are optimized for a single-user application.

Format:

```

<type>_<4 character id>

```

Examples:

```

r_Ab3x   record
a_K92p   account
f_91Lm   file

````

Rules:

- Separate namespaces per entity type.
- Custom ID generator.
- Integrity validation included.
- Collision checking performed locally.

Rationale:

- Single-user scope.
- Monthly chunk separation.
- Millions of possible combinations per entity type.

---

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

---

# Synchronization Model

Remote synchronization unit:

```
account + month
```

Example:

```
chunks/
    account123/
        2026-01.chunk
        2026-02.chunk
```

Each chunk contains the complete state for that period.

No remote operation log is stored.

---

# Local Change Log

Each client maintains a local-only change log.

Purpose:

* track local modifications
* prepare chunk regeneration
* support sync workflow

The change log is not synchronized to S3.

---

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
* Merge rules
* Conflict resolution

---

# Statistics

Monthly precomputed statistics.

Stored encrypted.

MVP:

* Statistics engine is deferred.

TODO:

* Calculation rules
* Storage format
* Refresh strategy

---

# Attachments

Attachments are encrypted before upload.

TODO:

* Storage format
* Metadata
* Deduplication

---

# Client Structure

The project uses a simple modular structure.

The initial implementation can be a single Vue application with clear internal modules.

```
BudgetClick 2.0
|
+-- src/
|   |
|   +-- app/
|   |   |
|   |   +-- Vue application
|   |   +-- pages
|   |   +-- routing
|   |
|   +-- core/
|   |   |
|   |   +-- data models
|   |   +-- business rules
|   |   +-- record management
|   |   +-- recurrence logic
|   |   +-- statistics logic
|   |
|   +-- sync/
|   |   |
|   |   +-- synchronization engine
|   |   +-- change tracking
|   |   +-- conflict handling
|   |
|   +-- encryption/
|   |   |
|   |   +-- key management
|   |   +-- encrypt/decrypt operations
|   |
|   +-- storage/
|   |   |
|   |   +-- IndexedDB adapter
|   |   +-- S3 adapter
|   |
|   +-- components/
|       |
|       +-- shared Vue components
|       +-- forms
|       +-- tables
|       +-- layouts
```

---

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

---

# Non Goals

The initial version will not include:

* User accounts managed by BudgetClick.
* Cloud storage managed by BudgetClick.
* Banking integrations.
* Server-side analytics.
* Multi-user collaboration.
* Shared wallets.
* Social features.

---

# iOS PWA

Uses the same web application.

Capabilities:

* Offline operation.
* IndexedDB storage.
* Web Crypto API.
* Direct S3 sync.

Limitations:

* No reliable background execution.
* Browser storage lifecycle limitations.

---

# Desktop

Uses the same web application.

Initial target:

* Browser/PWA.

No native wrapper.

---

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

---

# Future Improvements

* Optional private storage mode.
* Better conflict resolution.
* Version history.
* Backup snapshots.
* Multi-user support.
