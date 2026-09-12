# BudgetClick 2026 - Statistics

## Purpose

Statistics are derived, encrypted storage data calculated from transactions.

They provide:

- total income
- total outcome
- ending total balance
- the same values by account

Statistics do not separate actual and planned transactions.

## Storage

Statistics are stored as an independent versioned storage object.

They have their own `StorageMetadata` and `ManifestEntry`.

Statistics are cached in IndexedDB and synchronized like other storage objects.

They are derived data and can always be regenerated.

## Calculation

Initial calculation:

1. Download all required transaction chunks.
2. Calculate statistics.
3. Save the result.
4. Increment the statistics object version.

After a transaction change:

1. Recalculate statistics from the changed point forward.
2. Save the updated statistics.
3. Increment the statistics object version.

Future transaction chunks do not need to be downloaded when they are already available locally.

## Synchronization

The remote statistics object is synchronized by its object version.

A newer remote version replaces the local version.

Statistics do not use a source fingerprint or separate change-detection mechanism.
