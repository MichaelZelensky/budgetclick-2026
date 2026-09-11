# BudgetClick 2026 - Client Architecture

# Design Principles

Modular, feature-oriented, offline-first Vue.js application with shared business logic and clear layer boundaries.

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
Views → Components → State → Data
                                │
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
              Cache          Storage          Sync
                                │
                           Encryption
                                │
                        IndexedDB / S3
```