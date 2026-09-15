# BudgetClick 2026 - Migration Specification

# Design Principles

Migrations are immutable once shipped, append-only, deterministic, uniquely versioned, and never corrupt data on failure. Local and remote migrations are independent. Storage migration is exclusive and safely recoverable if interrupted.

# Migration Version

The client's supported version lives in `Settings.migrationVersion`; the remote version lives in `manifest.migration.version`. On startup: equal → normal start; client newer → run migrations; client older → abort and require an app update.

# Migration Types

- **Local:** migrates IndexedDB (schema, indexes, local config) before the app starts.
- **Storage:** migrates remote data (manifest, reference objects, chunks, statistics, attachments, layout) before sync; sync is blocked until it completes.

# Storage Migration Lock

Migration state lives in the manifest (`{ "migration": { "version": 5, "state": "idle" } }`, states `idle`/`running`). Only one client migrates at a time; others wait and retry. Locks expire after a limited lifetime, after which another client may retry.

# Migration Programs

Each version is an independent program under `client/migrations/<version>/index.ts`, responsible for its own transformations, layout updates, manifest updates, validation, and cleanup. Migrations run sequentially until the manifest version matches the client version.

# Migration Rules

Each migration: unique version, migrates from exactly one prior version, deterministic, idempotent, repeatable, safely recoverable, never modifies past migrations. Chains only (`1→2→3→4`); direct jumps (`1→4`) are not allowed.

When a migration introduces a new local storage object, it creates the object store and seeds an empty version-0 storage object. This ensures the local storage object exists for both new and existing installations.

For an existing installation, when a migration introduces a new remote storage object, the migration creates the remote object from the seeded local object and adds its manifest entry if the entry does not already exist.

For a new installation, migrations only prepare the local database. After storage is unlocked, setup creates the new manifest and saves the seeded local storage objects to remote storage.

# Local Database Migration

On startup: read the local schema version → apply required migrations → store the new version.

# New Storage Initialization

For a new storage location: initialize encryption, create the manifest, load the seeded local storage objects, and save those objects to remote storage using the manifest references.

# Migration Failure

On failure: preserve original data, abort, release/expire the lock, report the error, and never leave storage inconsistent. Migrations must support safe retry after interruption.

# Migration Testing

Required for every migration: forward migration, deterministic output, idempotency, interrupted-migration recovery, unsupported versions, corrupted input. Existing migration tests are never removed.

# Future Compatibility

Expected future migrations: storage layout, encryption, schema, attachment format, key hierarchy updates — without requiring data resets.