# BudgetClick Storage Lambdas

AWS Lambda functions proxying between the BudgetClick PWA and user-owned S3 storage. The Lambda doesn't own or authenticate user storage — the user's S3 bucket must allow the required public operations.

## Files

```text
server/
  put.ts
  get.ts
  list.ts
  delete.ts
```

Handlers: `put.handler`, `get.handler`, `list.handler`, `delete.handler`.

## Local Development

No local server needed — local dev uses the local storage implementation. Lambdas are only built for testing/deploying the AWS integration.

## Build

Run the VS Code task `[Dev] Build Server Lambdas` (runs `build-server` from root `package.json`). Output: `server/dist/`, uploaded to AWS Lambda manually.

## AWS Lambda Setup

Create `budgetclick-storage-put`, `budgetclick-storage-get`, `budgetclick-storage-list`, and `budgetclick-storage-delete` on a current Node.js runtime, handlers `put.handler`, `get.handler`, `list.handler`, and `delete.handler`, using the matching compiled file from `server/dist/`. No AWS credentials are needed to access user storage.

## User S3 Storage

Each user supplies a public S3 path via BudgetClick settings; the bucket must allow public `GET`/`PUT`/`LIST`/`DELETE`. There's no BudgetClick-controlled prefix — the Lambda receives the storage path with every request and must not assume a fixed bucket, account, or prefix.

## API

**PUT**

```json
{ "storagePath": "https://example-bucket.s3.us-east-1.amazonaws.com/", "key": "manifest", "body": "...", "contentType": "application/octet-stream" }
```

**GET**

```json
{ "storagePath": "https://example-bucket.s3.us-east-1.amazonaws.com/", "key": "manifest" }
```

**LIST**

Returns the object keys in the configured storage path.

```json
["manifest", "salt", "A/A1bC9xY2", "B/BmQ8zK1a"]
```

**DELETE**

Deletes one object from the configured storage path.

```json
{ "storagePath": "https://example-bucket.s3.us-east-1.amazonaws.com/", "key": "A/A1bC9xY2" }
```

## Deployment

Manual: build → open each Lambda in AWS Console → upload compiled JS → publish → test against a user S3 bucket. Automation can be added once the storage API is stable.

## Security

The storage path is user-controlled and untrusted; the Lambda must validate the requested location and key before any operation. BudgetClick data is encrypted before it's stored remotely.
