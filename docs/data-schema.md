# BudgetClick 2026 - Data Schema

## Purpose

This document defines the domain model used by BudgetClick.

It specifies:

- application entities
- relationships
- versioning rules
- lifecycle rules

Detailed storage, synchronization and encryption are specified in their respective documents.

# Design Principles

The data model follows these principles:

- Keep entities small and focused.
- Keep financial events independent from financial objects.
- Avoid premature abstraction.
- Design for future compatibility.
- Prefer new entities over extending existing ones.

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

# Common Fields

Most entities contain:

- id
- createdAt
- updatedAt

Entities supporting deletion additionally contain:

- isDeleted

The deletion model is specified by the synchronization protocol.

# Record

Represents one financial event.

Fields:

- id
- direction
- amount
- accountId
- categoryId
- contractorId
- description
- datetime
- attachments
- isActual
- recurrenceId
- createdAt
- updatedAt
- isDeleted

Notes:

- `direction` indicates whether money enters or leaves an account.
- Records remain intentionally simple during the MVP.
- Future financial concepts should introduce new entities instead of extending records indefinitely.

# Direction

Allowed values:

- in
- out

Examples:

Salary

```
direction = in
```

Groceries

```
direction = out
```

Transfer between accounts

Savings account

```
direction = out
```

Checking account

```
direction = in
```

Transfers are represented by two independent records.

# Account

Represents a balance container.

Examples:

- Cash
- Wallet
- Checking Account
- Savings Account

Fields:

- id
- name
- description
- currency
- currentBalance
- createdAt
- updatedAt
- isDeleted

Notes:

- Every account has exactly one currency.
- Current balance is stored explicitly.
- Historical balances are derived from records.

# Category

Represents a transaction category.

Examples:

- Food
- Salary
- Rent
- Utilities

Fields:

- id
- name
- description
- createdAt
- updatedAt
- isDeleted

# Contractor

Represents a person or organization associated with a record.

Examples:

- Employer
- Supermarket
- Utility Company

Fields:

- id
- name
- description
- createdAt
- updatedAt
- isDeleted

# Recurrence

Represents a recurring transaction definition.

Fields:

- id
- name
- createdAt
- updatedAt
- isDeleted

MVP Notes:

- Recurrence generation is not implemented.
- Planned records are created manually.
- Future versions will generate planned records automatically.

# Attachments

Attachments are referenced from records.

The attachment storage format is specified separately.

# Relationships

Record

- belongs to one Account
- belongs to one Category
- optionally belongs to one Contractor
- optionally belongs to one Recurrence
- may reference multiple Attachments

Account

- owns many Records

Category

- referenced by many Records

Contractor

- referenced by many Records

Recurrence

- referenced by many Records

# Identifier Strategy

Identifier format:

```
<type>_<8 character id>
```

Examples:

```
r_Ak39LmP2
a_Qw82NdXa
c_Fd91LpRt
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

Future functionality should be introduced through new entities whenever possible.

# Open Decisions

The following topics remain intentionally open:

- Attachment metadata
- Recurrence schema
- Asset model
- Investment model
- Bank integration model

# Related Documents

- design.md
- storage-contract.md
- sync.md
- encryption.md
- migrations.md