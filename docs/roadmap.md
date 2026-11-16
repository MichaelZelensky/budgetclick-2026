# BudgetClick 2026 - Development Roadmap

## Phase 0 - Architecture & Design

Goal:

Complete the technical specification before implementation.

Activities:

- ✅Finalize `architecture.md`
- ✅Finalize `storage.md`
- ✅Finalize `data.md`
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

### Client module setup priority

Build from the bottom up. The higher-level modules depend on the lower ones, and this minimizes rework.

Suggested order:

0. **Base**
   - ✅Schema generation
   - ✅Build process
   - ✅Validators generation
   - ✅Implement tests
   - ✅Build the production desktop running environment (Docker container)
   - ✅Logger with log levels

1. **Settings**
   - ✅Load `config.json` and `settings.json`
   - ✅Load user settings, add the view, persist user settings in browser memory
   - ✅Local user settings (storage path; derived key and salt in IndexedDB `encryptionKeys`)
   - ✅Validate config and settings
   - ✅Global constants (app state with immutable objects)

2. **Encryption**
   - ✅Key derivation
   - ✅AES-GCM encrypt/decrypt
   - ✅Serialization helpers
   - ✅Tests

3. **Storage**
   - ✅Storage interfaces
   - ✅IndexedDB adapter
   - ✅S3 adapter
   - ✅Binary read/write

4. **Local Database (IndexedDB)**
   - ✅Database initialization
   - ✅Object stores
   - ✅Transactions
   - ✅Version management

5. **Migrations**
   - ✅Local migration framework
   - ✅Storage migration framework
   - ✅Runner
   - ✅Version checks

6. **Repositories (`data/`)**
   - ✅AccountRepository
   - ✅CategoryRepository
   - ✅TransactionRepository
   - ✅ContractorRepository

7. **State**
   - ✅Reactive application state
   - ✅Current settings
   - ✅Current database
   - Sync status

8. **Cache**
   - Derived balances
   - Statistics
   - Query caching

9. **Sync**
   - Manifest
   - Dirty tracking
   - Merge
   - Upload/download

10. **Views**
    - ✅Setup wizard
    - ✅Main application

## Phase 1 - Development Environment

Goal:

Create the development and deployment foundation.

Activities:

- ✅Setup repository
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

- ✅S3 connection
- ✅Application shell
  1. ✅Tailwind + base styles + variables
  2. ✅Responsive breakpoints
  3. ✅Application shell — header, menu, footer
  4. ✅Router
  5. ✅Dashboard + Settings views
  6. ✅Reusable UI components
  7. ✅Responsive testing + polish
  8. ✅Tests where applicable
- ✅Initial setup flow
  1. ✅Provide user guidance
  2. ✅Initialize manifest if the storage is new
- ✅Local IndexedDB storage
  1. ✅Set up IndexedDB
  2. ✅Implement migrations (scripts + migration engine)
  3. ✅Implement initial data flow and CRUD for all entities
- ✅Encryption layer
  - ✅Define encryption contract
  - ✅Update setup flow: passphrase → encryption key → encrypted manifest
  - ✅Implement PBKDF2 key derivation
  - ✅Generate and persist storage salt
  - ✅Persist derived encryption key locally
  - ✅Implement `client/src/encryption/`
  - ✅Integrate encryption into storage transport
  - ✅Remove `EncryptedObject` type
  - ✅Encrypt manifest and all storage objects
  - ✅Add encryption tests
- ✅Synchronization engine
  - ✅Update contract / `docs/sync.md`
  - ✅Import existing remote data during setup
  - ✅Define initial transaction loading strategy
  - ✅Synchronize remote changes to local data
  - ✅Accept newer remote objects
  - ✅Synchronization tests
- ✅Bank account management
- ✅Categories
- ✅Contractors
- ✅Transaction explorer
  - ✅Income / expense
  - ✅Planned / actual
  - ✅Edit a record
  - ✅Transaction list
  - ✅Infinite scrolling (load more button)
  - ✅Date selection
  - ✅Balance after transaction
- ✅Monthly statistics
  - ✅Rates
- ✅Basic offline workflow

Expected outcome:

- Personal finance tracker usable on multiple devices.

## Phase 3 - Iteration 1

Goal:

Expand personal finance management capabilities.

Activities:

- ✅Recurrence engine
- ✅Search
- ✅Filtering
- ✅Reporting improvements
- ✅Attachments
- ✅Import / export

Expected outcome:

- More automated personal finance management.

## Phase 4 - Finalization

Goal:

Stabilize the free version and prepare it for release.

Activities:

- Debugging and bug fixing
- UX improvements
- Reliability improvements
- Automated and user scenario tests
- Final validation across supported devices and browsers

Expected outcome:

- Stable, reliable free version.
- All implemented functionality fixed and maintained.
- Roadmap for the free version completed.

## Beyond the Free Version

Further development will be outside the scope of the free version and considered for BudgetClick Premium.
