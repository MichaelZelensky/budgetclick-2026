# BudgetClick 2026 - IndexedDB

## Design Principles

IndexedDB is the local working database and mirrors the logical structure of remote storage, but holds **decrypted** data (remote storage stays encrypted). Not relational — relationships are resolved by application logic via identifiers.

## Database

Name: `budgetclick`, initial version `1`. Version is controlled solely by schema migrations.

## Object Stores

| Store | Key | Purpose | Migration |
| ------------- | ------- | -------------------------------------------- | --- |
| `accounts` | `key` | Local copy of accounts storage object | 001 |
| `categories` | `key` | Local copy of categories storage object | 001 |
| `contractors` | `key` | Local copy of contractors storage object | 001 |
| `chunks` | `month` | Local monthly transaction chunks | 001 |
| `encryptionKeys` | — | Derived encryption key and salt | 002 |
| `statistics` | `key` | Local copy of statistics storage object | 003 |
| `balances` | `key` | Local copy of balances storage object | 003 |
| `rates` | `key` | Local copy of rates storage object | 004 |
| `offlineSync` | `key` | Pending-sync state (`docs/offline-mode.md`) | 005 |
| `attachments` | `id` | Locally cached attachment objects | 006 |
| `recurrences` | `key` | Local copy of recurrences storage object | 007 |

Data stores each map to one logical remote storage object or group; `encryptionKeys` and `offlineSync` are local-only. The manifest is not stored in IndexedDB.

## Manifest

The latest manifest is cached in `localStorage` so the app works offline; the remote manifest remains authoritative when online. A manifest pending upload is kept in `offlineSync.manifest`.

## Reference and Derived Objects

`accounts`, `categories`, `contractors` and `recurrences` each hold one record (key `"current"`) containing that object's metadata + entity array. `statistics`, `balances`, `rates` and `offlineSync` each hold one record keyed by the store name.

## Monthly Chunks

`chunks` holds one `ChunkStorage` per remote chunk, keyed by month (`YYYY-MM`, e.g. `2026-08`). Transactions live inside their chunk record rather than as individual rows, mirroring the remote model.

## Attachments

`attachments` holds locally cached attachment objects, keyed by attachment ID. The attachment ID is also the remote storage object key.

Each attachment contains:

```ts
{
  name: string;
  type: string;
  data: string;
}
```

`name` is the original filename, `type` is the MIME type, and `data` is the attachment bytes encoded as base64 for JSON serialization.

Attachments are cached on demand and are not required to be loaded during initial synchronization. The cache is not the source of truth; a missing attachment is retrieved from remote storage when needed.

## Keys & Indexes

Remote `objectKey` values live in the manifest and aren't used as IndexedDB keys. Attachment IDs are used directly as keys in the `attachments` store. No indexes in the initial schema — transactions are queried in application code; indexes may be added when justified.

## Offline Operation

The app must run fully from cached manifest, reference objects, chunks, and locally available attachments when storage is unavailable. Local writes apply immediately; sync happens separately and is never a prerequisite for opening the app.

## Synchronization State

The `offlineSync` store retains enough state to resume sync after a restart or network/storage failure. This sync metadata is local-only and shouldn't leak into remote storage objects.

## Transactions & Versioning

Multi-store changes needing atomicity use IndexedDB transactions, exposed by the adapter without leaking IndexedDB details to domain logic. Schema changes are sequential, immutable database versions (1 → 2 → 3 …).

## Initialization

Startup must: open `budgetclick` → apply pending upgrades → expose the DB to app state → only proceed if this succeeds.

## Relationship to Remote Storage

```
Remote encrypted object → Download → Decrypt → IndexedDB object
       ↑                                              │
     Upload ← Encrypt ← Local changes ←───────────────┘
```

Attachments follow the same encryption flow but are not represented in the manifest.
