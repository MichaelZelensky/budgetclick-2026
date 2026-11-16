# BudgetClick 2026 - Storage

## Design Principles

Every user data object is encrypted and, except attachments, independently versioned. Storage is untrusted and holds no plaintext except the salt. Objects remain independent whenever possible.

## Storage Configuration

BudgetClick supports a local storage server (dev only) and remote S3-compatible storage, selected by environment variable; the storage path lives in user settings. Remote storage is accessed directly from the browser and requires bucket CORS. Dev always uses the local storage server (`docs/server.md`).

## S3 Storage

The user provides a storage path, e.g. `https://budgetclick-user-example.s3.us-east-1.amazonaws.com/`. This path is the access capability: fully user-configured, never stored or controlled by BudgetClick, and treated as sensitive. The user is responsible for creating/configuring a bucket that allows read, write, list, and delete. BudgetClick uses no AWS credentials.

The bucket is public by design. Everything in it is encrypted, so the worst an outsider can do is delete or overwrite objects, not read them.

The PWA calls the bucket directly: `GET`/`PUT`/`DELETE <storagePath><key>` and `GET <storagePath>?list-type=2` (ListObjectsV2, XML, paginated by `continuation-token`).

# S3 Setup (AWS example)

**1. Create the bucket**

```bash
AWS_REGION=us-east-1
BUCKET_NAME=budgetclick-user-example

aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"
# other regions:
aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"
```

Resulting path: `https://BUCKET_NAME.s3.us-east-1.amazonaws.com/`

**2. Disable public access blocking** (bucket relies on public policy access; ACLs stay disabled)

```bash
aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

If the account-level S3 Block Public Access setting blocks public policies, it overrides the bucket settings and must be relaxed too.

**3. Bucket policy** — grants anonymous `GetObject`/`PutObject`/`ListBucket`/`DeleteObject`. Delete is required for replacement imports: import deletes every remote object except `manifest` and `salt`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "BudgetClickPublicReadWrite", "Effect": "Allow", "Principal": "*",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::BUCKET_NAME/*" },
    { "Sid": "BudgetClickPublicList", "Effect": "Allow", "Principal": "*",
      "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::BUCKET_NAME" }
  ]
}
```

**4. CORS** — required. The origin must match exactly: `https://budgetclick.com`, with no `/pwa` and no trailing slash. Add the dev origin (e.g. `http://localhost:5173`) for local testing.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://budgetclick.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**5. Test**

```bash
P=https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/

curl -i "${P}?list-type=2"
curl -i -X PUT "${P}test.txt" -H "Content-Type: application/octet-stream" --data-binary 'hello111'
curl -i "${P}test.txt"
curl -i -X DELETE "${P}test.txt"
```

## CloudFormation (alternative to steps 1-4)

The template creates the bucket, public-access settings, bucket policy, and CORS. In the AWS console: **CloudFormation → Create stack → With new resources → Upload a template file** (`server/s3/cloudformation.yml`), enter a unique `BucketName`, and submit. When the status is `CREATE_COMPLETE`, copy `StoragePath` from the **Outputs** tab into BudgetClick. The account-level Block Public Access note from step 2 still applies. To delete the stack, empty the bucket first.

Template: [`server/s3/cloudformation.yml`](../server/s3/cloudformation.yml).

# Storage Layout

```
bucket/
  manifest
  salt
  A/
    A1bC9xY2
  B/
    BmQ8zK1a
  ...
```

`manifest` and `salt` are the only fixed-name objects (manifest encrypted, salt plaintext). All other objects use a random 8-character key, sharded by its first character; keys are unique across all storage objects. Application code uses the bare key; the storage layer adds the shard prefix and strips it from listed keys.

# Object Lifecycle

```
Serialize → Encrypt → Upload → Download → Decrypt → Deserialize
```

The storage layer only ever handles encrypted data. The salt is unencrypted because it's needed to initialize encryption.

The storage layer supports getting, putting, listing, and deleting objects. Import uses listing and deletion to remove all remote objects except `manifest` and `salt`.

Attachments use the same encryption flow. Each attachment is serialized as:

```json
{
  "name": "receipt.png",
  "type": "image/png",
  "data": "<base64-encoded file bytes>"
}
```

The attachment object is then encrypted and stored under its attachment ID.

# Storage Objects

- **Salt:** random value for key derivation; fixed name `salt`; unencrypted, not secret; must not change for the life of the key.
- **Manifest:** entry point into storage — schema version, manifest version, reference/chunk/statistics/balances object locations. Encrypted like all other objects.
- **Reference objects:** relatively static data (accounts, categories, contractors, rates, recurrences), synced independently of transactions.
- **Monthly chunks:** primary sync unit; each holds metadata + transaction records. The month comes from the manifest entry, not duplicated in the chunk.
- **Attachments:** encrypted JSON objects stored using their attachment ID as the object key. They have no metadata, version, or manifest entry. The `type` field preserves the MIME type required to recreate the browser Blob.
- **File size limit:** Every storage object must be no larger than 5 MB, including monthly chunks and attachments. The client enforces this before upload to keep storage usage under control.

# Metadata & Versioning

Every versioned object except manifest and salt carries `schemaVersion`, `version`, `createdAt`, `updatedAt`, `updatedBy`. Version increments on every change and drives sync/conflict detection.

Attachments are independent JSON data objects but are not versioned storage objects.

# Object Independence

Changing one object shouldn't require rewriting unrelated ones — e.g. editing categories doesn't rewrite chunks, editing a chunk doesn't rewrite reference objects, uploading an attachment doesn't touch others.

# Security Considerations

The storage path is a bearer credential — anyone holding it can access the bucket per its public policy. Accordingly: dedicate the bucket to BudgetClick, don't treat the name as secret but avoid publishing the full path unnecessarily, and never send it to analytics, logs, or third parties.

The salt may be public. All stored application data is encrypted, so public S3 access exposes only encrypted objects, not plaintext finances. An attacker with write access can overwrite or delete objects — object authentication must detect tampering on decryption, but deletion cannot be prevented by encryption.

# Future Compatibility

New functionality should introduce new storage object types rather than extending existing ones.