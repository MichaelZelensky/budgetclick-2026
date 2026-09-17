# BudgetClick 2026 — Offline Mode (Condensed)

**Purpose:** App stays usable offline. Changes persist locally (IndexedDB) and sync to file storage (S3) on reconnect. No conflict resolution in MVP. (See `docs/sync.md`/`docs/storage.md` for `Manifest` shape and pull-based sync basics.)

**Architecture:** State (memory) → IndexedDB (local copy, exact mirror of remote objects) → OfflineSync (sync metadata, tracked separately) → File Storage.

## MVP Trade-offs
- **No pull-before-push:** Push only updates the touched object's manifest entry; all others carry through from this device's *last-known local* manifest, not current remote state. If another device updated an untouched object while this device was offline, that update gets silently reverted. Fix (pull → rebase → push) is top post-MVP priority.
- **No migration interaction:** Reconnecting clients don't check/run pending migrations before pushing. Deferred; will need integration with `migrations.md`'s exclusive lock.

## OfflineSync Structure
```ts
interface OfflineSync {
  manifest: Manifest | null;  // full manifest, or null if synced
  objects: {
    chunks: Record<string, boolean>;  // by month
    statistics: boolean;
    accounts: boolean;
    categories: boolean;
    contractors: boolean;
    // future types: boolean, or Record<string,boolean> if sharded
  };
}
```
- `manifest` holds the latest **full** manifest needing sync (overwritten on each change, not appended); `null` once synced.
- `objects[type][shard?] = true` marks an object as needing upload.

## Sync Order (fixed, must be explicit in code — not object property order)
1. Reference data: `accounts`, `categories`, `contractors`, `rates`
2. Transaction `chunks[month]`
3. Derived: `statistics`, `balances`

Rationale: dependencies flow downward; this ordering limits the risk of derived data syncing ahead of its source if interrupted.

## Flows
**Normal/offline save:** `User change → IndexedDB → State → OfflineSync (if storage unreachable)`. No op-log — later local changes just overwrite; `OfflineSync` only flags "needs sync."

**Connectivity:**
- `navigator.onLine === false` → offline immediately.
- `navigator.onLine === true` does NOT guarantee reachability — storage requests are authoritative.
- Failed storage request → preserve change, mark pending, treat as out-of-sync, retry later. Don't treat app errors (auth/validation) as connectivity failures.
- `online` event triggers sync attempt; also triggerable on startup/other lifecycle events.

**Synchronization (per pending object, in order):**
```
upload object → success?
  → update this object's manifest entry (others unchanged) → push full manifest → success?
      → yes: clear OfflineSync.objects[type] flag
      → no: leave flag true (retry object+manifest together next time)
```
Manifest is pushed immediately after *each* object (not batched at the end) to minimize the window where the manifest references a not-yet-uploaded version. Flag clears only after **both** object upload and manifest push succeed; object uploads must be idempotent. A failed object blocks its dependents from syncing ahead of it.

## Crash/Reload Safety
`OfflineSync` must be persisted *before* attempting remote sync, so any interruption (reload/crash/close) leaves pending state recoverable. DB persists: local data, full manifest, and sync state.

## Empty/Synced State
```json
{"manifest": null, "objects": {"chunks": {}, "statistics": false, "accounts": false, "categories": false, "contractors": false}}
```

## Failure/Recovery
Persisted `OfflineSync` means any interruption is resumable: local data stays available, pending state persists, next sync attempt resumes. Object-upload-success-but-manifest-failure leaves the object flagged pending (safe to re-upload). Dependent objects never sync ahead of a failed prerequisite. App stays locally usable throughout.