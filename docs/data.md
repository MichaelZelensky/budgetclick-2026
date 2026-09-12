# BudgetClick 2026 - Data Schema

# Design Principles

Small, focused entities; financial events kept independent from financial objects; avoid premature abstraction; prefer new entities over extending existing ones; persisted schemas live only in `client/types/`.

# Schema Versioning

Every persisted object carries a schema version, used by local and remote migrations.

# Relationships

- **Transaction:** belongs to one Account and one Category, optionally one Contractor, may reference multiple Attachments.
- **Account:** owns many Transactions.
- **Category / Contractor:** referenced by many Transactions.

# Derived Data

Derived data is stored separately from primary entities and can be regenerated from transactions and reference data.

## Statistics

Statistics contain aggregated financial values:

- total income
- total outcome
- ending total balance
- the same values by account

Statistics are generated on demand. Initial generation downloads the transaction chunks required to calculate the complete result. After a transaction changes, statistics are recalculated from the affected point forward rather than downloading all chunks again.

Statistics are not authoritative financial data.

## Account Balances

Account balances are derived from the account starting balance and transaction history.

Balances are stored separately by month and account as ending balances. A balance entry represents the account's ending balance after the transactions in that month.

When a transaction changes, the affected month's balance is recalculated and the resulting balance delta is propagated through subsequent monthly balance entries. Future transaction chunks do not need to be downloaded because their existing ending balances provide the values needed for propagation.

The account's starting balance remains part of the Account data. Monthly balances are derived checkpoints.

## Search and Filtering

Search and filtering initially operate directly on transaction chunks.

If the required historical chunks are not cached locally, all transaction chunks are downloaded and cached before performing a historical search or filter. No separate search index is maintained in the MVP.

A search index may be introduced later if transaction history becomes large enough to make full historical downloads impractical.

# Identifier Strategy

Format: `<type>_<8-character id>`, e.g. `t_Ak39LmP2`. Random generation, local collision detection, one namespace per entity.

## Type Prefixes

| Entity | Prefix | Example |
|----------|--------|---------|
| Transaction | `t_` | `t_Ak39LmP2` |
| Account | `a_` | `a_Qw82NdXa` |
| Category | `c_` | `c_Fd91LpRt` |
| Contractor | `o_` | `o_Xy82LmQa` |
| Attachment | `f_` | `f_Mn73BxKe` |
| Recurrence *(future)* | `r_` | `r_Cv62NdQa` |

Prefixes are globally unique, permanent, and every future entity type gets its own.

# Lifecycle

`Create → Update → Delete (Tombstone) → Physical removal (future)`. MVP uses soft deletion; tombstones remain until all clients have processed the deletion.

# Future Compatibility

Schema must support new entities without redesigning existing ones: assets, liabilities, investments, exchange rates, bank connections, secrets, recurrences — introduced as new entities whenever possible.

# Open Decisions

Attachment metadata, asset model, investment model, bank integration model.
