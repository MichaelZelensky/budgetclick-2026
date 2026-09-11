# BudgetClick 2026 - Personal Finance Tracker - Design Specification

## Goals

- Offline-first, single Vue.js + TypeScript codebase for desktop, iOS, and web (PWA).
- Client-side encryption; user-owned S3-compatible storage as the shared source of truth.
- No backend services (no API, auth, database, functions, notifications) — minimize infrastructure cost.

# Architecture

```
Vue Application
       │
Shared Core Logic
       │
  ┌────┴────┐
  ▼         ▼
IndexedDB   S3 Storage
(local)     (sync source)
```

# Technology Stack

- **Frontend:** Vue.js, TypeScript, PWA, browser APIs only.
- **Local storage:** IndexedDB (cache, offline queue).
- **Remote storage:** S3-compatible object storage (AWS S3, Cloudflare R2, Backblaze B2, MinIO).

# Security Model

All sensitive data is encrypted locally before upload; the storage provider is untrusted and stores only encrypted objects. Object names are obfuscated where practical (chunk naming is finalized in the storage spec).

# Identity

No application authentication. Identity derives from storage location, local configuration, and the encryption key. Each install generates a persistent `clientId`, used only for sync/conflict detection — not user identity.

# Version Types

Independent version numbers: schema, manifest, storage, migration, encryption.

# Local Database

Holds decrypted working data, sync queue, change log, indexes, and cached statistics.

# Testing Strategy

Every build is tested.

- **Automated:** encryption/decryption, ID generation, serialization, migrations, sync logic, storage adapters.
- **User scenario:** offline creation + later sync, multi-device edits, restore from storage, restart recovery.

# Non-Goals (MVP)

BudgetClick-managed accounts/cloud storage, banking integrations, server-side analytics, multi-user/shared wallets, social features.

# Clients

- **iOS PWA:** offline, IndexedDB, Web Crypto, direct S3 sync. Limited background execution and storage lifecycle.
- **Desktop:** same web app, browser/PWA only (no native wrapper) for the initial target.
- **Structure:** single Vue app with clear internal modules, under `client/`.

# Future Domain Compatibility

Design must not block: asset tracking, net worth, banking/third-party integrations, multi-user encrypted storage, secret storage. Principles: separate events from entities, avoid expense-only assumptions, keep storage/integrations extensible, avoid single-user hard-coding. Not part of MVP.

# Future Improvements

Private storage mode, better conflict resolution, version history, backup snapshots, multi-user support, storage version history, key rotation.