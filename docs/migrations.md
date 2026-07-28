# BudgetClick 2026 - Migration Specification

## Purpose

This document defines how persisted data evolves between application versions.

It specifies:

- schema versioning
- storage versioning
- local database migrations
- remote storage migrations
- migration rules

Migration implementation is independent from synchronization and encryption.

# Design Principles

Migration follows these principles:

- Existing migrations are immutable.
- New migrations are append-only.
- Migrations are deterministic.
- Every migration is versioned.
- Local and remote migrations are independent.
- Failed migrations never corrupt user data.

# Version Types

BudgetClick uses multiple independent version numbers.

## Schema Version

The schema version describes the structure of application data.

Examples:

- Adding a field to a record
- Renaming a property
- Introducing a new entity

Schema version is stored together with every persisted object.

Example:

```json
{
    "schemaVersion": 1,
    "data": {}
}
```

## Storage Version

The storage version describes how objects are stored.

Examples:

- Storage layout changes
- Manifest changes
- Object envelope changes

Storage version is independent from the schema version.

## Encryption Version

The encryption version describes the encryption format.

Examples:

- New encryption algorithm
- New object envelope
- New key hierarchy

Encryption version is defined by the encryption specification.

# Migration Types

BudgetClick performs two independent migrations.

## Local Migration

Migrates the IndexedDB database.

Responsibilities:

- schema updates
- index updates
- local configuration updates

Local migration occurs before the application starts.

## Remote Migration

Migrates encrypted storage objects.

Responsibilities:

- storage objects
- manifest
- monthly chunks
- reference data
- statistics
- attachments

Remote migration occurs during synchronization.

# Migration Rules

Every migration must:

- have a unique version number
- migrate from one version only
- produce deterministic results
- be repeatable
- never modify previous migrations

Migration chain example:

```
1 → 2 → 3 → 4
```

Direct migrations are not required.

Example:

```
1 → 4
```

is never implemented.

# Object Migration

Every storage object is migrated independently.

Example:

```
Download

↓

Decrypt

↓

Read Version

↓

Migrate

↓

Use Object
```

Objects that already match the current version are not migrated.

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

# Remote Storage Migration

Remote storage objects are migrated individually.

Migration does not require migrating the entire storage at once.

Objects are migrated when they are downloaded or updated.

This allows gradual upgrades across devices.

# Backward Compatibility

The application supports opening storage created by older versions whenever possible.

Older application versions are not required to understand newer storage formats.

Backward compatibility is maintained through migrations rather than multiple runtime code paths.

# Migration Failure

If migration fails:

- preserve the original object
- abort the current operation
- report the error
- never upload partially migrated data

The application should remain in a recoverable state.

# Migration Testing

Every migration requires automated tests.

Tests should verify:

- forward migration
- deterministic output
- unsupported versions
- corrupted input
- rollback safety where applicable

Existing migration tests must never be removed.

# Future Compatibility

Future migrations may include:

- storage layout updates
- encryption updates
- schema changes
- attachment format updates

The migration framework should support long-term evolution without requiring data resets.

# Related Documents

- design.md
- storage-contract.md
- data-schema.md
- encryption.md
- sync.md