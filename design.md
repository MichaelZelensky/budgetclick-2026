# Budgetclick 2026 - Personal Finance Tracker - Design Specification

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

accounts/
    accounts.json

chunks/
    <accountId>/
        <yyyy-mm>.chunk

statistics/
    <yyyy-mm>.json

attachments/
    <attachmentId>
```


All objects are encrypted.

---

# Data Model

## Record

Fields:

- id
- in/out type
- amount
- accountId
- description
- expenseId
- contractorId
- datetime
- attachments
- actual/planned
- recurrencyId

TODO:

- Schema
- Versioning
- Deletion model

---

## Account

Fields:

- id
- name
- description
- currency
- current amount

TODO:

- Schema

---

## Recurrency

Rules:

- Records can belong to a recurrence.
- Planned records are generated from recurrence.
- Actual records are independent.
- Recurrence changes affect planned records only.
- Records can detach from recurrence.

TODO:

- Data model
- Generation algorithm

---

# Local Database

TODO:

- IndexedDB schema
- Indexes
- Migration strategy

Local database contains:

- decrypted working data
- sync queue
- indexes
- cached statistics

---

# Synchronization

Offline-first model.

Local changes happen immediately.

Sync happens when connection is available.

Triggers:

- application startup
- connection restored
- manual sync

TODO:

- Sync protocol
- Manifest format
- Change tracking
- Conflict resolution
- Retry strategy

---

# Sync Flow

```

User action
|
v
Local database
|
v
Sync queue
|
v
Encrypted S3 objects

```

TODO:

- Upload flow
- Download flow
- Merge rules

---

# Statistics

Monthly precomputed statistics.

Stored encrypted.

TODO:

- Calculation rules
- Storage format
- Refresh strategy

---

# Attachments

Attachments are encrypted before upload.

TODO:

- Storage format
- Metadata
- Deduplication

---

# Client Structure

The project uses a simple modular structure.

The initial implementation can be a single Vue application with clear internal modules. Modules can later be extracted into separate packages if needed.

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

## Module Responsibilities

### app

Vue application layer.

Responsible for:

- screens
- navigation
- user interactions
- connecting UI to application logic

### core

Application domain logic.

Responsible for:

- records
- accounts
- recurrency
- calculations
- statistics

No dependency on UI or storage.

### sync

Offline synchronization logic.

Responsible for:

- detecting changes
- uploading changes
- downloading updates
- conflict resolution

### encryption

Client-side security layer.

Responsible for:

- key handling
- encryption
- decryption
- encrypted object formats

### storage

Data access abstraction.

Implementations:

- IndexedDB for local storage
- S3 for remote storage

The rest of the application does not directly access storage APIs.

### components

Reusable Vue UI components.

Examples:

- buttons
- forms
- tables
- dialogs



---

# iOS PWA

Uses the same web application.

Capabilities:

- Offline operation
- IndexedDB storage
- Web Crypto API
- Direct S3 sync

Limitations:

- No reliable background execution
- Browser storage lifecycle limitations

---

# Desktop

Uses the same web application.

Initial target:

- Browser/PWA

No native wrapper.

---

# Future Improvements

- Optional private storage mode
- Better conflict resolution
- Version history
- Backup snapshots
- Multi-user support
