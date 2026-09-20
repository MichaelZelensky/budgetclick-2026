# BudgetClick 2026 - IndexedDB

## Design Principles

IndexedDB is the local working database and mirrors the logical structure of remote storage, but holds **decrypted** data (remote storage stays encrypted). Not relational — relationships are resolved by application logic via identifiers.

## Database

Name: `budgetclick`, initial version `1`. Version is controlled solely by schema migrations.

## Object Stores

| Store | Key | Purpose |
| ------------- | ------- | -------------------------------------------- |
| `manifest` | `key` | Locally cached manifest |
| `accounts` | `key` | Local copy of accounts storage object |
| `categories` | `key` | Local copy of categories storage object |
| `contractors` | `key` | Local copy of contractors storage object |
| `chunks` | `month` | Local monthly transaction chunks |
| `attachments` | `id` | Locally cached attachment files |

Each store maps to one logical remote storage object or group.

## Manifest & Reference Objects

`manifest` holds the latest locally available `Manifest` (key `"manifest"`) — cached so the app works offline; the remote manifest remains authoritative when online. `accounts`, `categories`, and `contractors` each hold one record (key `"current"`) containing that object's metadata + entity array.

## Monthly Chunks

`chunks` holds one `ChunkStorage` per remote chunk, keyed by month (`YYYY-MM`, e.g. `2026-08`). Transactions live inside their chunk record rather than as individual rows, mirroring the remote model.

## Attachments

`attachments` holds locally cached attachment files, keyed by attachment ID. The attachment ID is also the remote storage object key and filename.

Attachments are cached on demand and are not required to be loaded during initial synchronization. The cache is not the source of truth; a missing attachment is retrieved from remote storage when needed.

## Keys & Indexes

Remote `objectKey` values live in the manifest and aren't used as IndexedDB keys. Attachment IDs are used directly as keys in the `attachments` store. No indexes in the initial schema — transactions are queried in application code; indexes may be added when justified.

## Offline Operation

The app must run fully from cached manifest, reference objects, chunks, and locally available attachments when storage is unavailable. Local writes apply immediately; sync happens separately and is never a prerequisite for opening the app.

## Synchronization State

IndexedDB must retain enough state to resume sync after a restart or network/storage failure. Dirty/sync metadata is local-only and shouldn't leak into remote storage objects. No dedicated metadata store yet — add one only when a concrete need arises.

## Transactions & Versioning

Multi-store changes needing atomicity use IndexedDB transactions, exposed by the adapter without leaking IndexedDB details to domain logic. Schema changes are sequential, immutable database versions (1 → 2 → 3 …).

## Initialization

Startup must: open `budgetclick` → apply pending upgrades → expose the DB to app state → only proceed if this succeeds.

## Relationship to Remote Storage

```
Remote encrypted object → Download → Decrypt → IndexedDB object
       ↑                                              │
     Upload ← Encrypt ← Local changes ←────────────────┘
```

Attachments follow the same encryption flow but are not represented in the manifest.

## MVP Scope

Included: manifest, accounts, categories, contractors, monthly chunks, attachment cache.
Not yet included: a separate transaction store, a generic metadata store, sync engine, migration engine.
