# BudgetClick 2026 - Migration Specification

# Design Principles

Migration follows these principles:

- Existing migrations are immutable.
- New migrations are append-only.
- Migrations are deterministic.
- Every migration has a unique version.
- Local and remote migrations are independent.
- Failed migrations never corrupt user data.
- Storage migration is exclusive.
- Interrupted migrations must be safely recoverable.

# Migration Version

The migration version identifies the latest completed storage migration.

The client stores its supported migration version in `Settings`.

The remote storage stores the current migration version in the manifest.

Example:

```
settings.migrationVersion = 5

manifest.migration.version = 5
```

Comparison:

- Equal → normal startup.
- Client version is newer → run migrations.
- Client version is older → abort startup and require application update.

# Migration Types

BudgetClick performs two independent migrations.

## Local Migration

Migrates the IndexedDB database.

Responsibilities:

- schema updates
- index updates
- local configuration updates

Local migration occurs before the application starts.

## Storage Migration

Migrates remote storage.

Responsibilities:

- manifest
- reference objects
- monthly chunks
- statistics
- attachments
- storage layout

Storage migration executes before synchronization.

Synchronization is blocked until migration completes.

# Storage Migration Lock

Storage migration is exclusive.

The migration state is stored in the manifest.

Example:

```json
{
    "migration": {
        "version": 5,
        "state": "idle"
    }
}
```

States:

- idle
- running

Only one client may perform a storage migration at a time.

If another client detects a running migration, it waits and retries.

Migration locks have a limited lifetime.

If the lease expires, another client may safely retry the migration.

# Migration Programs

Each storage migration is implemented as an independent program.

Example:

```
client/
    migrations/
        1/
            index.ts
        2/
            index.ts
        3/
            index.ts
```

Migration programs are responsible for their own workflow.

Typical responsibilities include:

- object transformations
- storage layout updates
- manifest updates
- validation
- cleanup

Migrations execute sequentially until the manifest migration version matches the client migration version.

# Migration Rules

Every migration must:

- have a unique version number
- migrate from one version only
- produce deterministic results
- be repeatable
- be idempotent
- be safely recoverable after interruption
- never modify previous migrations

Migration chain example:

```
1 → 2 → 3 → 4
```

Direct migrations are never implemented.

Example:

```
1 → 4
```

is not allowed.

# Local Database Migration

The local database stores its own schema version.

Example:

```
Local Database

Schema Version = 5
```

When the application starts:

- Read local version.
- Apply required migrations.
- Store new version.

# Client Compatibility

Supported storage version is determined by the migration version.

If:

```
settings.migrationVersion == manifest.migration.version
```

the application starts normally.

If:

```
settings.migrationVersion > manifest.migration.version
```

the client performs the required storage migrations.

If:

```
settings.migrationVersion < manifest.migration.version
```

startup is aborted and the user is instructed to update the application.

Older clients never modify newer storage.

# Migration Failure

If migration fails:

- preserve the original data
- abort the migration
- release or allow expiration of the migration lock
- report the error
- never leave storage in an inconsistent state

Migration programs must support safe retry after interruption.

# Migration Testing

Every migration requires automated tests.

Tests should verify:

- forward migration
- deterministic output
- idempotency
- interrupted migration recovery
- unsupported versions
- corrupted input

Existing migration tests must never be removed.

# Future Compatibility

Future migrations may include:

- storage layout updates
- encryption updates
- schema changes
- attachment format updates
- key hierarchy updates

The migration framework should support long-term evolution without requiring data resets.