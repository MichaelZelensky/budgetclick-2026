# BudgetClick 2026 - Storage

## Design Principles

Every user data object is encrypted and independently versioned. Storage is untrusted and holds no plaintext except the salt. Objects remain independent whenever possible.

# Storage Configuration

BudgetClick supports local storage (dev/offline) and remote S3-compatible storage, selected by environment variable; the storage path lives in user settings.

## S3 Storage

The user provides a storage path, e.g. `https://budgetclick-user-example.s3.us-east-1.amazonaws.com/`. This path is the access capability: fully user-configured, never stored or controlled by BudgetClick, sent with every request, and treated as sensitive. The user is responsible for creating/configuring a bucket that allows read, write, and list. BudgetClick uses no AWS credentials.

## Remote Storage Proxy

Browsers don't talk to S3 directly; requests go through a proxy hosted at `liteed.com`:

```
BudgetClick PWA → (storage path + operation) → Storage Proxy → User's S3 Bucket
```

The proxy validates and parses the user-provided path as a supported S3 location before making the S3 request — it must never act as an arbitrary URL proxy — and it doesn't own, store, or become the source of truth for the data. Its purpose is avoiding browser-to-S3 CORS issues and isolating S3 protocol details from the PWA.

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

**3. Bucket policy** — grants anonymous `GetObject`/`PutObject`/`ListBucket` only:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "BudgetClickPublicReadWrite", "Effect": "Allow", "Principal": "*",
      "Action": ["s3:GetObject", "s3:PutObject"], "Resource": "arn:aws:s3:::BUCKET_NAME/*" },
    { "Sid": "BudgetClickPublicList", "Effect": "Allow", "Principal": "*",
      "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::BUCKET_NAME" }
  ]
}
```

No delete, bucket configuration, or IAM access is granted.

**4. No delete permission** — `s3:DeleteObject` is intentionally omitted; deletion is represented by application-level tombstones, limiting damage if the path leaks.

**5. Test**

```
curl -i "https://liteed.com/budgetclick-storage/get" \
  -H "X-Storage-Path: https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/" \
  -H "X-Storage-Key: manifest"

curl -i -X POST "https://liteed.com/budgetclick-storage/put" \
  -H "Content-Type: application/octet-stream" \
  -H "X-Storage-Path: https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/" \
  -H "X-Storage-Key: test.txt" --data-binary 'hello111'
```

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

`manifest` and `salt` are the only fixed-name objects (manifest encrypted, salt plaintext). All other objects use a random 8-character key, sharded by its first character.

# Object Lifecycle

```
Serialize → Encrypt → Upload → Download → Decrypt → Deserialize
```

The storage layer only ever handles encrypted data. The salt is unencrypted because it's needed to initialize encryption.

Attachments use the same encryption flow, but are stored as files directly under their attachment ID.

# Storage Objects

- **Salt:** random value for key derivation; fixed name `salt`; unencrypted, not secret; must not change for the life of the key.
- **Manifest:** entry point into storage — schema version, manifest version, reference/chunk object locations, attachment root. Encrypted like all other objects.
- **Reference objects:** relatively static data (accounts, categories, contractors), synced independently of transactions.
- **Monthly chunks:** primary sync unit; each holds metadata + transaction records. The month comes from the manifest entry, not duplicated in the chunk.
- **Attachments:** encrypted files stored directly using their attachment ID as the object key. They have no metadata, version, or manifest entry. Content type is determined from the file's magic bytes.

# Metadata & Versioning

Every versioned object except manifest and salt carries `schemaVersion`, `version`, `createdAt`, `updatedAt`, `updatedBy`. Version increments on every change and drives sync/conflict detection.

Attachments are not versioned storage objects and do not carry storage metadata.

# Object Independence

Changing one object shouldn't require rewriting unrelated ones — e.g. editing categories doesn't rewrite chunks, editing a chunk doesn't rewrite reference objects, uploading an attachment doesn't touch others.

# Security Considerations

The storage path is a bearer credential — anyone holding it can access the bucket per its public policy. Accordingly: dedicate the bucket to BudgetClick, don't treat the name as secret but avoid publishing the full path unnecessarily, and never send it to analytics, logs, or third parties other than the configured proxy.

The salt may be public. All stored application data is encrypted, so public S3 access exposes only encrypted objects, not plaintext finances. An attacker with write access can overwrite objects — object authentication must detect this tampering on decryption.

# Future Compatibility

New functionality should introduce new storage object types rather than extending existing ones.
