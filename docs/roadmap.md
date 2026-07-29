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
- Validate iOS PWA feasibility
- Define application state model

Expected outcome:

- Stable architecture
- Stable storage format
- Stable synchronization model
- Stable data model
- Stable encryption model
- Ready for implementation

## Phase 1 - Development Environment

Goal:

Create the development and deployment foundation.

Activities:

- ✅Setup repository (done)
- ✅Setup AI-assisted tooling
- Setup Vue + TypeScript project
- Setup PWA configuration
- Setup development environment
- Setup VS Code Dev Container
- Setup local testing environment
- Setup deployment pipeline
- Setup development S3 storage

Expected outcome:

- Application can be built, deployed and installed.
- Development workflow is established.

## Phase 2 - MVP Implementation

Goal:

Build the first usable version.

Scope:

- Application shell
- Initial setup flow
- Local IndexedDB storage
- Encryption layer
- PBKDF2 key derivation
- S3 connection
- Synchronization engine
- Account management
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