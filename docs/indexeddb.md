# BudgetClick 2026 - IndexedDB Contract

## Design Principles

IndexedDB is the local working database for the offline-first application.

The local database mirrors the logical storage-object structure used by remote storage.

The database stores decrypted application data.

Remote storage stores encrypted objects.

IndexedDB is not a relational database. Relationships between entities are represented by identifiers and resolved by application logic.

## Database

Database name: `budgetclick`

Initial database version: `1`

The database version is controlled exclusively by IndexedDB schema migrations.

## Object Stores

The initial database contains these object stores:

| Store         | Key     | Purpose                                      |
| ------------- | ------- | -------------------------------------------- |
| `manifest`    | `key`   | Locally cached manifest                      |
| `accounts`    | `key`   | Local copy of the accounts storage object    |
| `categories`  | `key`   | Local copy of the categories storage object  |
| `contractors` | `key`   | Local copy of the contractors storage object |
| `chunks`      | `month` | Local monthly transaction chunks             |

Each store represents a logical storage object or group of storage objects.

## Manifest

The `manifest` store contains the latest locally available `Manifest`.

The manifest is cached locally so the application can continue operating when remote storage is unavailable.

The local manifest is not necessarily the current remote manifest.

When online, the remote manifest remains the synchronization source of truth.

The store contains one record:

```text
key = "manifest"
```

The value is a `Manifest`.

## Reference Objects

The following stores contain the corresponding decrypted remote storage objects:

* `accounts` → `AccountsStorage`
* `categories` → `CategoriesStorage`
* `contractors` → `ContractorsStorage`

Each store contains one record.

The record key is:

```text
key = "current"
```

The `metadata` and entity arrays are stored together as defined by the corresponding storage type.

## Monthly Chunks

The `chunks` store contains local copies of monthly transaction chunks.

Each record corresponds to one remote `ChunkStorage` object.

The record key is the month:

```text
YYYY-MM
```

For example:

```text
2026-08
```

The record value is a `ChunkStorage`.

Transactions remain inside their monthly chunk rather than being stored as individual IndexedDB records.

This mirrors the remote storage model:

```text
Remote storage:

chunk object
    ↓
ChunkStorage
    ↓
Transaction[]
```

and locally:

```text
IndexedDB:

chunks["2026-08"]
    ↓
ChunkStorage
    ↓
Transaction[]
```

## Keys

The `manifest`, `accounts`, `categories`, and `contractors` stores contain one current record each.

The `chunks` store uses the month as its primary key.

Remote object keys such as `objectKey` are stored in the manifest and are not used as IndexedDB primary keys.

## Indexes

The initial schema does not define indexes.

Transactions are stored inside monthly chunks and are queried in application code.

Additional indexes may be introduced when concrete application requirements justify them.

## Offline Operation

The application must be able to operate using the locally cached IndexedDB state when remote storage is unavailable.

At minimum, offline operation requires:

* locally cached manifest
* locally cached reference objects
* locally cached monthly chunks

User changes are applied to local data immediately.

Synchronization with remote storage occurs separately when storage becomes available.

The application must not require a successful remote manifest request merely to open and use existing local data.

## Synchronization State

IndexedDB must preserve enough local state for synchronization to resume after:

* application restart
* temporary network failure
* remote storage failure

Dirty state and synchronization metadata are local concerns.

They must not be added to the remote storage objects unless explicitly required by the storage contract.

A dedicated metadata store is not part of the initial schema. It will be introduced only when a concrete local metadata requirement cannot be represented by the existing stores.

## Transactions

Changes affecting multiple local storage objects must use an IndexedDB transaction when atomicity is required.

The database adapter must expose transaction boundaries without exposing IndexedDB implementation details to domain logic.

## Versioning

Database schema changes are represented by IndexedDB database versions.

Example:

```text
Version 1
    ↓
Version 2
    ↓
Version 3
```

A newer database version may add or modify stores and indexes.

Existing migration versions are immutable.

Migrations are applied sequentially.

## Initialization

Application startup must:

1. Open the `budgetclick` database.
2. Apply required schema upgrades.
3. Make the database available to application state.
4. Continue startup only after database initialization succeeds.

The database must not be considered initialized when opening or upgrading fails.

## Relationship to Remote Storage

IndexedDB is the local working copy.

Remote S3 storage remains the shared source of truth.

The relationship is:

```text
Remote encrypted object
        ↓
    Download
        ↓
      Decrypt
        ↓
IndexedDB storage object
        ↓
   Local changes
        ↓
      Encrypt
        ↓
      Upload
        ↓
Remote encrypted object
```

The local database therefore mirrors the logical storage-object structure while containing decrypted data suitable for offline application use.

## MVP Scope

The initial IndexedDB implementation includes:

* manifest
* accounts
* categories
* contractors
* monthly transaction chunks

The following are not included:

* attachments
* separate transaction store
* generic metadata store
* synchronization engine
* migration engine

These are implemented in subsequent development steps.
