# BudgetClick 2026 — Synchronization Specification (Condensed)

## Principles

- Offline-first; local IndexedDB holds the working copy of remote data.
- Remote storage is the shared source of truth.
- Sync happens at the object level; a newer remote object replaces its local counterpart and unrelated objects are untouched.
- No merging: the MVP always accepts the remote version wholesale (manual conflict resolution is a future feature).

## Object Model

Every synchronized object has:

- **Object key** — stable, randomly generated at creation, never changes, stored in the manifest, obfuscates storage names. Objects are overwritten in place by key.
- **Version** — an integer incremented (`version += 1`) on every change. A missing local object is treated as version `0`.

**Remote manifest**: downloaded and decrypted at startup, kept in application state for the session (not persisted as its own IndexedDB record). It is the authoritative index of object keys + latest remote versions, and is compared directly against each local object's stored version.

```
Local version 3, Remote version 3 → no download needed
Local version 3, Remote version 4 → download, decrypt, validate, replace local
```

## Synchronization Flow

Runs on **app startup** and during **existing-storage setup** (future: manual trigger, reconnect, scheduled/background sync).

```
Download + decrypt remote manifest
      ↓
Load local object versions from IndexedDB
      ↓
For each object: compare remote vs. local version
      ↓
Skip if remote ≤ local
      ↓
Download → decrypt → validate → verify version matches manifest
      ↓
Save to IndexedDB → update application state
```

**Local → remote** is handled entirely by normal app writes (save to IndexedDB → update state → encrypt → upload → update manifest). The sync engine only pulls remote changes; it has no separate push path.

## Initial Setup / Import

```
Configure existing storage → load salt → derive encryption key
      ↓
Download + decrypt + validate manifest
      ↓
Download reference data (accounts, categories, contractors)
      ↓
Download transaction chunks needed for the initial view (see selection rules)
      ↓
Decrypt, validate, save to IndexedDB → initialize application state
```

Not all historical data is fetched — only what's needed for the first view; remaining chunks stay remote until requested.

### Transaction Chunk Selection (MVP)

Transactions are stored in full monthly chunks (never trimmed individually):

1. Load current + future months, chronologically, until ≥100 transactions are loaded.
2. If current/future months are empty, load past months newest→oldest until ≥20 transactions are loaded.
3. If fewer transactions exist than the target, load all available applicable chunks.

Additional chunks load on-demand when the user navigates or sync requires them.

## Conflict Handling

No manual resolution in the MVP — a newer remote version is simply accepted. Stronger conflict detection is deferred to a future feature.

## Error Handling

Sync failures must never corrupt local data:

- Covers network interruption, storage unavailable, invalid data, decryption/validation failure, or version mismatch.
- On any failure, the existing local object is kept as-is.
- A downloaded object is saved **only** after it passes validation and its version matches the manifest entry.

## Client Identifier

Each install has a persistent `clientId`, used for attributing the latest change, diagnostics, and future conflict resolution. It is not synced as user identity.

## Future Work

- Manual conflict resolution
- true optimistic concurrency
- background/reconnect/scheduled sync
- sync queues & retries
- incremental sync
- sync diagnostics
- advanced merge strategies.