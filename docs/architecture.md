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

All storage objects are encrypted.

Object names should be obfuscated where practical. Whether monthly chunk names remain predictable for synchronization efficiency will be decided in the storage specification.

# Identity

No application authentication.

Identity is based on:

- Storage location
- Local configuration
- Encryption key

Each client installation generates a persistent `clientId`.

The `clientId` is used only for synchronization and conflict detection. It is not part of user identity.

# Version Types

BudgetClick uses multiple independent version numbers.

* Schema version
* Manifest version
* Storage version
* Migration version
* Encryption version


# Local Database

Local database contains:

- decrypted working data
- sync queue
- local change log
- indexes
- cached statistics


# Testing Strategy

Testing is the part of each development iteration.

Tests should be performed on each build.

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


## Desktop

Uses the same web application.

Initial target:

* Browser/PWA.

No native wrapper.


## Client Structure

The project uses a simple modular structure.

The initial implementation can be a single Vue application with clear internal modules.

The client file structure is located in `client/` and is self-explaining.


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
