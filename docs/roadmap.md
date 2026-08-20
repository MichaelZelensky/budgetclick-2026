# BudgetClick 2026 - Development Roadmap

## Phase 0 - Architecture & Design

Goal:

Complete the technical specification before implementation.

Activities:

- ✅Finalize `design.md`
- ✅Finalize `storage-contract.md`
- ✅Finalize `data-schema.md`
- ✅Finalize `sync.md`
- ✅Finalize `encryption.md`
- ✅Finalize `migrations.md`
- ✅Set up the client
- ✅Validate iOS PWA feasibility
- ✅Define application state model

Expected outcome:

- Stable architecture
- Stable storage format
- Stable synchronization model
- Stable data model
- Stable encryption model
- Ready for implementation

### Client module setup priority:

```
Build from the bottom up. The higher-level modules depend on the lower ones, and this minimizes rework.

Suggested order:

0. **Base**
- ✅schema generation
- ✅build process
- ✅validators generation
- ✅implement tests
- ✅build the production desktop running environment (docker container)
- ✅logger with log levels

1. **Settings**

   * ✅Load `config.json` and `settings.json`
   * ✅Load the user settings, add the view, persist the user settings in the browser memory
   * ✅Local user settings (passphrase and storage path)
   * ✅Validate config and settings
   * ✅Global constants (app state with immutable objects)

2. **Encryption**

   * Key derivation
   * AES-GCM encrypt/decrypt
   * Serialization helpers
   * Tests

3. **Storage**

   * Storage interfaces
   * IndexedDB adapter
   * S3 adapter
   * Binary read/write

4. **Local Database (IndexedDB)**

   * Database initialization
   * Object stores
   * Transactions
   * Version management

5. **Migrations**

   * Local migration framework
   * Storage migration framework
   * Runner
   * Version checks

6. **Repositories (`data/`)**

   * AccountRepository
   * CategoryRepository
   * TransactionRepository
   * ContractorRepository

7. **State**

   * Reactive application state
   * Current settings
   * Current database
   * Sync status

8. **Cache**

   * Derived balances
   * Statistics
   * Query caching

9. **Sync**

   * Manifest
   * Dirty tracking
   * Merge
   * Upload/download

10. **Views**

    * Setup wizard
    * Unlock screen
    * Main application
```
## Phase 1 - Development Environment

Goal:

Create the development and deployment foundation.

Activities:

- ✅Setup repository (done)
- ✅Setup AI-assisted tooling
- ✅Setup Vue + TypeScript project
- ✅Setup PWA configuration
- ✅Setup development environment
- ✅Setup VS Code Dev Container
- ✅Setup local testing environment
- ✅Setup deployment pipeline
- ✅Setup development S3 storage

Expected outcome:

- Application can be built, deployed and installed.
- Development workflow is established.

## Phase 2 - MVP Implementation

Goal:

Build the first usable version.

Scope:

- Application shell
   1. ✅Tailwind + base styles + variables
   2. ✅Responsive breakpoints
   3. ✅Application shell — header, menu, footer
   4. ✅Router
   5. ✅Dashboard + Settings views
   6. ✅Reusable UI components
   7. ✅Responsive testing + polish
   8. ✅Tests where applicable
- Initial setup flow
- Local IndexedDB storage
- Encryption layer
- PBKDF2 key derivation
- ✅S3 connection
- Synchronization engine
- Bank account management
- Categories
- Contractors
- Records
  - income / expense
  - planned / actual
- Monthly statistics
- Basic offline workflow

Included:

- Automatic synchronization
- Automatic merge
- Optimistic concurrency

Excluded:

- Manual conflict resolution
- Compression
- Recurrence engine
- Attachments
- Banking integrations
- Multi-user features

Expected outcome:

- Personal finance tracker usable on multiple devices.

## Phase 3 - Iteration 1

Goal:

Improve usability and reliability.

Activities:

- Manual conflict resolution
- Compression
- Improve synchronization reliability
- Improve UI / UX
- Improve data entry flow
- Add validation
- Expand automated tests
- Run user scenario tests
- Argon2id key derivation

Expected outcome:

- Stable daily-use version.

## Phase 4 - Iteration 2

Goal:

Improve productivity features.

Activities:

- Recurrence engine
- Planned transaction improvements
- Better search
- Better filtering
- Reporting improvements

Expected outcome:

- More automated personal finance management.

## Phase 5 - Iteration 3

Goal:

Advanced functionality.

Activities:

- Attachment support
- Reports
- Data visualization
- Export / Import
- Backup tools
- Key rotation

Expected outcome:

- Mature personal finance platform.

## Every Iteration Includes

### Development

- Feature implementation
- Refactoring
- Documentation updates

### Quality

- Automated tests
- User scenario tests
- Manual validation

### Documentation

Update:

- design.md
- storage-contract.md
- data-schema.md
- sync.md
- encryption.md
- migrations.md

### Architecture

Review:

- Design decisions
- Storage format
- Synchronization strategy
- Migration strategy