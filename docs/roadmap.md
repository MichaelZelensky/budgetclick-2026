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

   * ✅Key derivation
   * ✅AES-GCM encrypt/decrypt
   * ✅Serialization helpers
   * ✅Tests

3. **Storage**

   * ✅Storage interfaces
   * ✅IndexedDB adapter
   * ✅S3 adapter
   * ✅Binary read/write

4. **Local Database (IndexedDB)**

   * ✅Database initialization
   * ✅Object stores
   * ✅Transactions
   * ✅Version management

5. **Migrations**

   * ✅Local migration framework
   * ✅Storage migration framework
   * ✅Runner
   * ✅Version checks

6. **Repositories (`data/`)**

   * ✅AccountRepository
   * ✅CategoryRepository
   * ✅TransactionRepository
   * ✅ContractorRepository

7. **State**

   * ✅Reactive application state
   * ✅Current settings
   * ✅Current database
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

    * ✅Setup wizard
    * ✅Main application
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
   1. ✅Set up IndexedDb
   2. ✅Implement Migration (migration scripts + migration engine)
   3. ✅Implement initial data flow and CRUD for all entities
- ✅Encryption layer
   - ✅Define encryption contract
   - ✅Update setup flow:
       passphrase → encryption key → encrypted manifest
   - ✅Implement PBKDF2 key derivation
   - ✅Generate and persist storage salt
   - ✅Persist derived encryption key locally
   - ✅Implement `client/src/encryption/`
   - ✅Integrate encryption into storage transport:
       encrypt before PUT
       decrypt after GET
   - ✅Remove `EncryptedObject` type
   - ✅Encrypt manifest and all storage objects
   - ✅Add encryption tests
- ✅Synchronization engine
   - ✅Update contract / docs/sync.md
   - ✅Import existing remote data during setup
   - ✅Define initial transaction loading strategy
   - ✅Synchronize remote changes to local data
   - ✅Accept newer remote objects
   - ✅Synchronization tests
- ✅Bank account management
- ✅Categories
- ✅Contractors
- Refine the transaction explorer views
  - transaction widget:
   - ✅income / expense
   - ✅planned / actual
   - ✅edit a record
  - list of transactions
   - infinite scrolling ("load more" button)
   - date selection
   - balance after transaction
- ✅ Monthly statistics
   - ✅ rates

```

1. ✅ **Migration**

   * IndexedDB `rates` store
   * Remote encrypted `rates` object
   * Manifest `references.rates`
   * Local settings migration already handled separately

2. ✅ **Repository/data loading**

   * `repository/data.ts` must load rates
   * state initialization/reset already needs `referenceData.rates`
   * repository for CRUD: `repository/rates.ts`

3. ✅ **Currency Rates view**

   * List/grid: `From → To → Date → Rate`
   * Add/edit/delete
   * Probably sort by date
   * Could have convenient inverse-rate handling, but I'd avoid automatic creation of inverse records unless explicitly wanted.

4. ✅ **Navigation**

   * New **Currency Rates** settings/configuration view
   * Route/menu entry

5. ✅ **Statistics calculation**

   * This is the major part.
   * Account amounts are currently in their account currencies.
   * Total income/outcome/balance must convert each account's value into `settings.defaultCurrency`.
   * Rate selection must be **date-aware**: use the latest rate whose date is ≤ the transaction/statistics date.
   * Missing rate needs defined behavior, probably an error rather than silently using 1.

6. ✅ **Statistics rebuild/update**

   * `calculateMonthlyStatistics()`
   * `updateStatistics()`
   * `rebuildStatistics()`
   * All need access to rates/default currency.
   * Changing a rate or default currency potentially makes **all historical statistics stale**.

7. ✅ **Default currency change**

   * If user changes default currency, existing total statistics need rebuilding.
   * Account-specific statistics don't need conversion because they remain in account currency.
   * UI should probably warn/trigger rebuild automatically.

8. ✅ **Rate change**

   * Adding/editing a historical rate can affect multiple months.
   * Therefore rate CRUD probably needs to trigger a **full statistics rebuild**, at least initially.

10. ✅ **Sync**

* Rates become reference data and need normal manifest/version synchronization.
* Changes to rates need to be persisted locally and remotely just like accounts/categories/contractors.

11. ✅**Setup**

* First account already establishes `defaultCurrency` - Update Settings when using initialized and used storage with multiple accounts.
* No rates are needed if there's only one currency.
* Once a second currency is introduced, the app should probably make it clear that a conversion rate is required for totals.

12. ✅ **Validation**

* Currency code validation?
* Rate must be `> 0`.
* Date format.
* `from !== to`.
* Probably prevent duplicate `(from, to, date)` entries.

### One design decision I'd make now

I'd structure the rates view as:

**Currency Rates**

| From | To  | Date       |     Rate |
| ---- | --- | ---------- | -------: |
| EUR  | USD | 2026-01-01 |     1.17 |
| EUR  | USD | 2026-06-01 |     1.18 |
| VND  | USD | 2026-01-01 | 0.000039 |

And define:

> A rate remains valid until another rate for the same `from → to` pair is entered.

That matches your stated model nicely.

I'd also **not put rates inside Accounts**. Accounts can show their currency, while the separate Rates view owns exchange-rate history.

The next important thing before coding is probably to settle **how conversion works when there is no direct rate**, e.g. `VND → USD` exists but `EUR → USD` doesn't. Whether we allow chained conversion (`EUR → VND → USD`) is a significant architectural choice.

```


- Basic offline workflow

Included:

- Automatic synchronization

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

Improve productivity features.

Activities:

- Recurrence engine
- Planned transaction improvements
- Search
- Filtering (widget)
- Reporting improvements
- attachments
- import / export

Expected outcome:

- More automated personal finance management.

## Phase 4 - Iteration 2

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