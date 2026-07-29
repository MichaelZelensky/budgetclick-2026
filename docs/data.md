# BudgetClick 2026 - Data Schema

# Design Principles

The data model follows these principles:

- Keep entities small and focused.
- Keep financial events independent from financial objects.
- Avoid premature abstraction.
- Design for future compatibility.
- Prefer new entities over extending existing ones.
- Define persisted schemas only in `client/types/`.

# Schema Versioning

Every persisted object contains a schema version.

Example:

```json
{
  "schemaVersion": 1,
  "data": {}
}
```

Schema versions are used by both local and remote migrations.

# Entity Types

Persisted entity schemas are defined in:

```
client/types/
```

Current entities:

- Transaction
- Account
- Category
- Contractor

# Relationships

Transaction

- belongs to one Account
- belongs to one Category
- optionally belongs to one Contractor
- may reference multiple Attachments

Account

- owns many Transactions

Category

- referenced by many Transactions

Contractor

- referenced by many Transactions

# Identifier Strategy

Identifier format:

```
<type>_<8 character id>
```

Examples:

```
t_Ak39LmP2
a_Qw82NdXa
c_Fd91LpRt
k_Xy82LmQa
```

Rules:

- Separate namespace per entity.
- Random generation.
- Local collision detection.

# Lifecycle

Entity lifecycle:

```
Create

↓

Update

↓

Delete (Tombstone)

↓

Physical removal (future)
```

The MVP uses soft deletion.

Deleted entities remain available for synchronization until all clients have processed the deletion.

# Future Compatibility

The schema should support future entities without redesigning existing ones.

Expected future entities include:

- Assets
- Liabilities
- Investments
- Exchange Rates
- Bank Connections
- Secrets
- Recurrences

Future functionality should be introduced through new entities whenever possible.

# Open Decisions

The following topics remain intentionally open:

- Attachment metadata
- Asset model
- Investment model
- Bank integration model