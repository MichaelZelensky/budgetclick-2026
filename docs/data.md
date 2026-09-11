# BudgetClick 2026 - Data Schema

# Design Principles

Small, focused entities; financial events kept independent from financial objects; avoid premature abstraction; prefer new entities over extending existing ones; persisted schemas live only in `client/types/`.

# Schema Versioning

Every persisted object carries a schema version, used by local and remote migrations.

# Relationships

- **Transaction:** belongs to one Account and one Category, optionally one Contractor, may reference multiple Attachments.
- **Account:** owns many Transactions.
- **Category / Contractor:** referenced by many Transactions.

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