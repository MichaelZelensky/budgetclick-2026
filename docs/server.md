# BudgetClick Storage Lambdas

AWS Lambda functions used as the storage proxy between the BudgetClick PWA and user-owned S3 storage.

The Lambda does not own or authenticate against user storage. User S3 storage is configured by the user and must allow the required public operations.

## Files

```text
server/
  put.ts
  get.ts
```

Each Lambda exports:

```text
handler
```

AWS Lambda handler names:

```text
put.handler
get.handler
```

## Local development

The Lambdas do not require a local server.

Local development uses the local storage implementation. The Lambda functions only need to be built when testing or deploying the AWS integration.

## Build

Run the VS Code task:

```text
[Dev] Build Server Lambdas
```

This runs the `build-server` script from the root `package.json`.

Compiled files are written to:

```text
server/dist/
```

The generated JavaScript files are uploaded to AWS Lambda manually.

## AWS Lambda setup

Create three Lambda functions:

```text
budgetclick-storage-put
budgetclick-storage-get
```

Use a current Node.js Lambda runtime.

Set the handlers to:

```text
put.handler
get.handler
```

Upload the corresponding compiled JavaScript file from `server/dist/`.

The Lambda does not need AWS credentials to access user storage.

## User S3 storage

Each user supplies a public S3 storage path through BudgetClick settings.

The bucket must allow public:

* `GET`
* `PUT`

The storage path identifies the user's bucket. There is no BudgetClick-controlled prefix.

The Lambda receives the storage path with every request and operates on that location.

The Lambda must not assume a fixed bucket, account, or storage prefix.

## API

### PUT

Request:

```json
{
  "storagePath": "https://example-bucket.s3.us-east-1.amazonaws.com/",
  "key": "manifest",
  "body": "...",
  "contentType": "application/octet-stream"
}
```

### GET

Request:

```json
{
  "storagePath": "https://example-bucket.s3.us-east-1.amazonaws.com/",
  "key": "manifest"
}
```

The response body is base64 encoded.

## Deployment

Deployment is currently manual:

1. Run `[Dev] Build Server Lambdas`.
2. Open AWS Lambda.
3. Open the corresponding Lambda function.
4. Upload the compiled JavaScript.
5. Update/publish the function.
6. Test it with a user S3 bucket.

Deployment automation can be added once the storage API is stable.

## Security

The storage path is user-controlled.

The Lambda must validate the requested storage location and object key before performing any operation.

User storage is considered untrusted.

BudgetClick data is encrypted before it is stored remotely.
