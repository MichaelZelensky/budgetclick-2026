# BudgetClick 2026 - Client Architecture

# Design Principles

- Modular.
- Feature-oriented.
- Offline-first.
- Vue.js application.
- Shared business logic.
- Clear layer boundaries.

# Directory Structure

```text
client/
  cache/
  components/
  data/
  encryption/
  migrations/
  server/
  settings/
  state/
  storage/
  sync/
  tests/
  types/
  views/
```

# Module Responsibilities

| Module | Responsibility |
|---------|----------------|
| cache | Cached queries and computed data |
| components | Reusable Vue components |
| data | Domain logic and repositories |
| encryption | Key derivation and object encryption |
| migrations | Local and storage migrations |
| server | Local development server |
| settings | Global configuration |
| state | Global application state |
| storage | IndexedDB and S3 operations |
| sync | Synchronization engine |
| tests | Unit and integration tests |
| types | Persisted schemas and shared types |
| views | Route-level Vue views |

# Layered Architecture

```text
Views
    │
Components
    │
State
    │
Data
    │
+-------------+-------------+
│             │             │
Cache      Storage       Sync
                │
          Encryption
                │
     IndexedDB / S3