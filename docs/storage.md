# BudgetClick 2026 - Storage Contract

## Design Principles

Storage follows these principles:

- Every object is encrypted.
- Every object is independently versioned.
- Storage is considered untrusted.
- Storage contains no plaintext user data.
- Storage objects are independent whenever possible.

# Storage Configuration

BudgetClick supports local and remote storage. The storage type is controlled by enviroment variables. The storage path is stored in the user settings.

## Local Storage

Local storage is used during development and for offline operation. No remote storage is required.

## S3 Storage

Remote storage uses an S3-compatible object store. The user provides a storage path in the application settings.

Example:

```text
https://budgetclick-user-example.s3.us-east-1.amazonaws.com/
```

The storage path identifies the user's S3 bucket and acts as the access capability.

The storage path is:

- configured entirely by the user
- not controlled by BudgetClick
- not stored by BudgetClick on a server
- sent with each remote storage request
- treated as sensitive configuration

The user is responsible for creating and configuring the S3 bucket.

The configured storage location must allow:

- reading objects
- writing objects
- listing objects

BudgetClick does not use AWS credentials.

## Remote Storage Proxy

Browser clients do not access S3 directly.

Remote storage requests are sent through the storage proxy hosted by `liteed.com`.

```text
BudgetClick PWA
      |
      | storage path + operation
      v
Storage Proxy
      |
      | S3 request
      v
User's S3 Bucket
```

The proxy:

- receives the user-provided storage path with each request
- accepts only supported S3-compatible storage paths
- performs the requested storage operation
- does not own or manage the user's storage
- does not store the user's storage configuration
- does not become the source of truth for application data

The proxy must never operate as an arbitrary URL proxy. User-provided paths must be parsed and validated as supported S3 storage locations before an S3 request is made.

The proxy exists primarily to avoid browser-to-S3 CORS requirements and to isolate S3 protocol details from the PWA.

# S3 Setup

The following example uses AWS S3.

The user creates a bucket that is dedicated to BudgetClick. The bucket URL itself acts as the storage capability.

## 1. Create the Bucket

Choose a unique bucket name.

Example:

```bash
AWS_REGION=us-east-1
BUCKET_NAME=budgetclick-user-example

aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$AWS_REGION"
```

For regions other than `us-east-1`, specify the location constraint:

```bash
aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"
```

The resulting storage path is:

```text
https://BUCKET_NAME.s3.us-east-1.amazonaws.com/
```

## 2. Disable Public Access Blocking

Because the bucket intentionally uses public anonymous access, S3 Block Public Access must allow the bucket policy.

For this bucket:

```bash
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

ACLs remain disabled. Public access is granted exclusively through the bucket policy.

## 3. Configure the Bucket Policy

The bucket policy grants anonymous access to the entire dedicated BudgetClick bucket.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BudgetClickPublicReadWrite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    },
    {
      "Sid": "BudgetClickPublicList",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::BUCKET_NAME"
    }
  ]
}
```

Replace `BUCKET_NAME` with the actual bucket name.

The policy grants:

- anonymous `GetObject`
- anonymous `PutObject`
- anonymous `ListBucket`

It does not grant:

- bucket deletion
- object deletion
- bucket configuration changes
- IAM access

## 4. Do Not Grant Delete Permission

The MVP should not grant `s3:DeleteObject`.

Object deletion is not required for the initial storage contract. Logical deletion is represented by application-level tombstones.

This also reduces the damage possible if the storage path is disclosed.

## 5. Test the Storage Location

1. Save `manifest` JSON file in the bucket
2. Test the storage:

  - GET:

```
curl -i \
  "https://liteed.com/budgetclick-storage/get" \
  -H "X-Storage-Path: https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/" \
  -H "X-Storage-Key: manifest"
```

  - POST:

```
curl -i -X POST \
  "https://liteed.com/budgetclick-storage/put" \
  -H "Content-Type: application/octet-stream" \
  -H "X-Storage-Path: https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/" \
  -H "X-Storage-Key: test.txt" \
  --data-binary 'hello111'
```

# Storage Layout

```
bucket/
  manifest

  obj/
    A/
      A1bC9xY2
    B/
      BmQ8zK1a
    ...
```

The manifest is the only object with a fixed name.

All other objects use a stable, randomly generated 8-character object key.

Objects are stored under a shard determined by the first character of the object key.


# Storage Object Lifecycle

Every storage object follows the same lifecycle.

```
Storage Object

↓

Serialize

↓

Encrypt

↓

Upload

↓

Download

↓

Decrypt

↓

Deserialize
```

The storage layer never operates on decrypted data.


# Storage Objects

## Manifest

The manifest is the entry point into storage.

It contains:

- schema version
- manifest version
- reference object locations
- monthly chunk locations
- attachment root

The manifest is encrypted like every other storage object.


## Reference Objects

Reference objects store relatively static data.

Examples:

- accounts
- categories
- contractors

Reference objects are synchronized independently from transaction data.


## Monthly Chunks

Monthly chunks are the primary synchronization unit.

Each chunk contains:

- metadata
- transaction records

The month is determined by the manifest entry and is not duplicated inside the chunk.


## Attachments

Attachments are stored as independent encrypted objects.

Attachment object keys are referenced directly by transaction records.


# Storage Metadata

Every storage object except the manifest contains the same metadata.

Metadata includes:

- schemaVersion
- version
- createdAt
- updatedAt
- updatedBy


# Object Versioning

Every storage object has an independent version.

The version is incremented whenever the object changes.

Object versions are used for synchronization and conflict detection.


# Object Independence

Storage objects should remain independent.

Changing one object should not require rewriting unrelated objects.

Examples:

- changing categories does not rewrite monthly chunks
- changing a chunk does not rewrite reference objects
- uploading an attachment does not modify other attachments

# Security Considerations

The storage path is a bearer credential.

Anyone possessing the storage path can access the bucket according to its public policy.

Therefore:

- the bucket should be dedicated to BudgetClick
- the bucket name should not be treated as secret
- the complete storage path should not be published unnecessarily
- the storage path must not be included in application analytics or logs
- the storage path must not be sent to third-party services except the configured storage proxy

All application data stored in S3 remains encrypted before upload. Public S3 access therefore exposes encrypted application objects rather than plaintext financial data.

# Future Compatibility

New functionality should introduce new storage object types whenever possible rather than extending existing ones.

Security:
- storage uses public S3 bucket, an attacker can write anything to it.