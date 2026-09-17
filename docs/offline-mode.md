# BudgetClick 2026 - Offline Mode

## Purpose

The application must remain fully usable when the network is unavailable.

Offline changes are persisted locally and synchronized to file storage when connectivity returns.

There is **no conflict resolution** in the offline MVP.

This document covers the local dirty-tracking and retry queue (`OfflineSync`) that offline mode adds. For the `Manifest` / `ManifestEntry` shape and the general pull-based sync flow, see `docs/sync.md` and `docs/storage.md` — this document does not redefine them.

## Architecture

IndexedDB is the durable local working copy.

File storage remains the remote persistent copy.

The application state remains in memory.

Storage objects in IndexedDB remain **exact copies of file storage objects**. Synchronization metadata is stored separately.

```text
                 ┌──────────────┐
                 │    State     │
                 │   (memory)   │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  IndexedDB   │
                 │ local copy   │
                 └──────┬───────┘
                        │
                  OfflineSync
                        │
                        ▼
                 ┌──────────────┐
                 │ File Storage │
                 │    (S3)      │
                 └──────────────┘
```

## Known MVP Trade-offs

The following simplifications are accepted for MVP and are expected to be addressed in future work:

- **No pull-before-push.** Synchronization does not fetch and reconcile the current remote manifest before pushing local changes. A device reconnecting after another device has already synced can overwrite remote state with a stale local manifest. Concretely: the manifest push described below only updates the entry for the object just uploaded and copies every other entry through unchanged from this device's own last-known local manifest — not from current remote state. If another device changed an untouched object (e.g. `categories`, `balances`) while this device was offline, that other device's update will be silently reverted when this device pushes. "Other object versions stay intact" therefore only holds relative to what this device last saw, not relative to current remote state. Fixing this (pull latest remote manifest, rebase pending local versions on top of it, then push) should be prioritized as soon as possible after MVP.
- **No interaction with storage migration.** This spec does not define what happens if the remote migration version has advanced while a client was offline. A reconnecting client currently does not check for or run pending migrations before pushing. This is deferred to future work; migrations.md's exclusive migration lock will need to be integrated with the sync trigger described here.

## OfflineSync

A dedicated IndexedDB storage object tracks pending synchronization.

It does not modify the stored file objects.

```ts
interface OfflineSync {
  manifest: Manifest | null;
  objects: {
    chunks: Record<string, boolean>; // keyed by month, e.g. "2026-09"
    statistics: boolean;
    accounts: boolean;
    categories: boolean;
    contractors: boolean;
    // future object types follow the same boolean-flag pattern,
    // or a Record<string, boolean> if the object is sharded (like chunks)
  };
}
```

### Manifest

`manifest` contains the **full manifest** (see `Manifest` in `docs/sync.md`), not a flag or partial representation.

When the manifest changes, the latest complete manifest is saved to `OfflineSync.manifest`.

If the manifest changes multiple times before synchronization, only the latest full manifest needs to be retained.

```text
manifest !== null
    ↓
manifest needs synchronization
```

After successful synchronization:

```text
manifest = null
```

### Objects

`objects` identifies storage objects that need synchronization, grouped by object type. Sharded object types (currently only `chunks`) are keyed by their shard identifier (month); non-sharded types are a single boolean.

For example:

```json
{
  "chunks": { "2026-09": true },
  "statistics": true,
  "accounts": true
}
```

The value `true` indicates the corresponding object needs to be uploaded.

## OfflineSync Synchronization Order

Pending objects must be synchronized in this order:

1. **Reference data**
   - `accounts`
   - `categories`
   - `contractors`
   - `rates`

2. **Transaction chunks**
   - `chunks[month]`

3. **Derived data**
   - `statistics`
   - `balances`

This order is intentional:

- Reference data is required by transaction data.
- Statistics and balances are derived from transaction data.
- If synchronization is interrupted, this minimizes the chance of derived data being synchronized before its source data.

The order must be explicit in the synchronization implementation. It must not depend on the property order of the `OfflineSync.objects` object.

## Normal Save Flow

The existing data flow remains responsible for normal saves:

```text
Save object
    ↓
DB
    ↓
State
    ↓
Storage
```

Offline mode adds persistence of synchronization state.

When a storage operation cannot be completed because the application is offline, the corresponding `OfflineSync` entry is persisted.

For a manifest change:

```text
current full manifest
        ↓
OfflineSync.manifest
```

For a storage object:

```text
OfflineSync.objects[type][shard?] = true
```

## Offline Operation

While offline:

```text
User change
    ↓
IndexedDB
    ↓
State
    ↓
OfflineSync
```

Changes accumulate locally.

Multiple changes to the same object do not create an operation log. The local DB contains the latest object, and `OfflineSync` only records that it needs synchronization.

## Connectivity Detection

The application uses two connectivity signals:

- `navigator.onLine` provides the browser's network status.
- A failed storage request indicates that the application cannot currently reach file storage.

`navigator.onLine === false` immediately puts the application into offline mode.

`navigator.onLine === true` does not guarantee that file storage is reachable. Storage requests remain authoritative for synchronization.

If a storage operation fails:

- preserve the local change;
- persist the corresponding `OfflineSync` entry;
- treat the application as out-of-sync;
- retry when connectivity is restored.

The browser `online` event triggers a synchronization attempt.

A successful storage request confirms that file storage is reachable again.

## Synchronization

Synchronization starts when connectivity returns.

It should also be possible to trigger synchronization on application startup and other appropriate lifecycle events.

For each pending object, the manifest is updated and pushed immediately after that object's own upload succeeds — rather than pushing one final manifest after all objects are uploaded. This keeps the remote manifest and the remote objects it references consistent with each other at (nearly) every point in the sync process, minimizing the window in which an interrupted sync leaves the manifest pointing at a version that doesn't yet exist remotely.

**Manifest update, per object:**

```text
upload object succeeds
    ↓
in OfflineSync.manifest: set entry for this object's
  objectKey + version + updatedAt/updatedBy
  (all other entries copied through unchanged)
    ↓
push full OfflineSync.manifest to remote (overwrites remote manifest object)
    ↓
success?
    ↓ yes                              ↓ no
OfflineSync.objects[...] = false     leave OfflineSync.objects[...] = true
                                      (retry object + manifest push together
                                       on next sync trigger)
```

Full loop:

```text
online
  ↓
for each pending object (accounts, categories, contractors, statistics, each pending chunk):
    upload object
      ↓ success
    update this object's entry in OfflineSync.manifest
      ↓
    push OfflineSync.manifest
      ↓ success
    OfflineSync.objects[...] = false
```

Each object's flag is set to `false` only after **both** the object upload and its corresponding manifest push succeed. If the process is interrupted between the object upload and the manifest push, the flag remains `true` and the object is simply re-uploaded (idempotent) on the next attempt, followed by another manifest push.

If synchronization fails at any step, the entry remains persisted so it can be retried.

## Crash / Reload Safety

`OfflineSync` must be persisted before relying on synchronization completing.

A reload, tab close, PWA restart, or crash during synchronization must not lose knowledge of pending changes.

The DB therefore provides:

* local data persistence
* full manifest persistence
* pending synchronization state

## Empty State

When everything is synchronized:

```json
{
  "manifest": null,
  "objects": {
    "chunks": {},
    "statistics": false,
    "accounts": false,
    "categories": false,
    "contractors": false
  }
}
```

The `OfflineSync` record can remain in IndexedDB as a predictable, empty state.

## Conflict Resolution

No conflict resolution is implemented.

The MVP assumes that the local changes being synchronized are authoritative. As noted above, this includes not pulling and reconciling the remote manifest before pushing, which means unrelated manifest entries can be reverted to this device's stale view when it pushes — see "Known MVP Trade-offs."

Concurrent modifications from another client/device are outside the scope of offline mode.

## Implementation

Offline mode is implemented in the following stages:

1. **Initialize `OfflineSync`**

   * Add an IndexedDB migration.
   * Initialize and seed the `OfflineSync` storage object.

2. **Update manifest flow**

   ```text
   load manifest
       ↓
   update manifest
       ↓
   save full manifest to OfflineSync
       ↓
   attempt storage
       ↓
   success → set OfflineSync.manifest = null
   failure → leave OfflineSync.manifest unchanged
   ```

   The pending manifest must be persisted before attempting the remote operation.

3. **Update data flow**

   ```text
   update
       ↓
   DB
       ↓
   State
       ↓
   OfflineSync
       ↓
   attempt storage
       ↓
   success → clear corresponding OfflineSync entry
   failure → leave OfflineSync entry pending
   ```

   The local DB and state are therefore updated regardless of remote connectivity.

4. **Add connectivity state**

   * Initialize from `navigator.onLine`.
   * Listen to `online` and `offline`.
   * Use storage/network failures as an additional connectivity signal.
   * Do not classify application errors such as authorization or validation failures as connectivity failures.

5. **Add offline UI indicator**

   The UI derives the synchronization state from connectivity and `OfflineSync`.

   At minimum:

   ```text
   Synced
   Offline · changes will sync
   Syncing…
   Not synced
   ```

6. **Trigger synchronization when connectivity returns**

   * Listen to the browser `online` event.
   * Start synchronization when the application becomes online.
   * Synchronization must also be possible on application startup.

7. **Implement `offline-sync.ts`**

   The synchronization process:

   * loads the persisted `OfflineSync`;
   * sets application loading state to `true`;
   * processes pending objects in dependency order;
   * uploads each object;
   * updates and uploads the full manifest;
   * clears each `OfflineSync` entry only after successful remote synchronization;
   * leaves failed entries pending for retry;
   * sets loading state to `false` when synchronization finishes.

   Synchronization order:

   ```text
   reference data
       ↓
   chunks
       ↓
   statistics
       ↓
   balances
   ```

   The order must be explicit in the synchronization implementation and must not depend on JavaScript object property order.

8. **Prevent concurrent synchronization**

   Only one `offline-sync` operation may run at a time.

   This prevents simultaneous sync operations from being triggered by multiple connectivity events, application lifecycle events, or saves.

## Synchronization Failure and Recovery

`OfflineSync` is persisted before remote synchronization is attempted.

Therefore, if the application is interrupted at any point:

* the local data remains available;
* pending synchronization state remains persisted;
* the next synchronization attempt can resume from `OfflineSync`.

If an object upload succeeds but its manifest upload fails, the object remains marked as pending. The object may be uploaded again on the next attempt; object uploads must therefore be safe to repeat.

If synchronization fails for one object, later dependent objects must not be synchronized ahead of it.

The application remains usable locally while synchronization is pending.
