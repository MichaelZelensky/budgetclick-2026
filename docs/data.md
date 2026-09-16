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

See `docs/stats.md` for statistics content, currency handling, and calculation/sync rules. Statistics are not authoritative financial data.

## Account Balances

Account balances are derived from the account starting balance and transaction history.

Balances are stored separately by month and account as starting-balance checkpoints. A balance entry represents the account balance at the beginning of the month, before that month's transactions are applied.

When a transaction is created or changed, the affected month's balance checkpoint is created if necessary, and the resulting balance delta is propagated through subsequent existing monthly balance entries.

The spreadsheet calculates each transaction's balance from the starting balance for its month and the transactions in that month up to that transaction.

For example, an account with a 5000 CHF starting balance has a 300 CHF transaction in September:

- September: 5000 CHF
- September transaction balance: 4700 CHF

When a 100 CHF transaction is added in October:

- September: 5000 CHF
- October: 4700 CHF
- October transaction balance: 4600 CHF

Balances can also be completely rebuilt from all transaction chunks. During a rebuild, the account starting balance is used as the starting balance of the first transaction month, and each subsequent month's starting balance is calculated from the preceding month's transactions.

The account's starting balance remains part of the Account data. Monthly balances are derived checkpoints.

Balances are stored in IndexedDB and encrypted remote storage together with their metadata.


# Identifier Strategy

Format: `<type>_<8-character id>`, e.g. `t_Ak39LmP2`. Random generation, local collision detection, one namespace per entity.

# Type Prefixes

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