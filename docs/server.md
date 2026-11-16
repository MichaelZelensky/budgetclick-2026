# BudgetClick Local Storage Server

Development-only server that replaces the S3 bucket during local development and testing. It is not used in production: the browser accesses the user's S3 bucket directly (see `docs/storage.md`).

Storage functions use the local filesystem (`storage/` in the working directory) instead of S3. Run the VS Code task `[Dev] Run Local Storage Server`.
