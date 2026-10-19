# BudgetClick Storage Lambdas

Serverless storage proxy functions for BudgetClick.

## Files

```text
server/
  put.ts
  get.ts
  list.ts
  delete.ts
```

The browser accesses the functions through:

```text
https://liteed.com/budgetclick-storage/...
```

The architecture is:

```text
BudgetClick PWA
      │
      ▼
CloudFront
liteed.com
      │
      ▼
API Gateway HTTP API
      │
      ▼
AWS Lambda
      │
      ▼
User-owned S3 storage
```

The Lambda functions do not own the user's data and do not use AWS credentials to access the user's bucket.

---

## 1. Lambda source files

The four functions are:

```text
server/put.ts
server/get.ts
server/list.ts
server/delete.ts
```

Each function exports:

```text
handler
```

The Lambda handler is therefore:

```text
index.handler
```

---

## 2. package.json requirement

**Every Lambda function must have its own `package.json`.**

The package file must contain:

```json
{
  "type": "commonjs"
}
```

This is required because the compiled Lambda code uses CommonJS.

---

## 3. Build the Lambda functions

Use the VS Code task:

```text
[Dev] Build Server Lambdas
```

The compiled files are written to:

```text
server/dist/
```

Expected output:

```text
server/dist/
  put.js
  get.js
  list.js
  delete.js
```

The compiled files are used as the Lambda `index.js` code.
# AWS Lambda setup

Repeat the following procedure for each function.

## 4. Create a Lambda function

Open:

**AWS Console → Lambda → Functions → Create function**

Choose:

* **Author from scratch**
* Current Node.js runtime
* Default architecture

Create the appropriate function:

```text
budgetclick-storage-put
budgetclick-storage-get
budgetclick-storage-list
budgetclick-storage-delete
```

* Increase timeout to 30s.
* Set memory allcation to 512Mb for put function. This is required for file upload.

---

## 5. Configure the handler

After creating the function, open:

**Runtime settings → Edit**

Set:

```text
Handler:
index.handler
```

Save.

---

## 6. Add the Lambda code

The Lambda code can be entered directly in the AWS Lambda inline editor.

Build the project locally first:

```text
[Dev] Build Server Lambdas
```

Then open the corresponding compiled file from:

```text
server/dist/
```

For each Lambda, copy the **entire contents** of the compiled file into the AWS Lambda editor.

Use:

```text
put.js    → index.js
get.js    → index.js
list.js   → index.js
delete.js → index.js
```

In the AWS Lambda editor, the file must therefore be named:

```text
index.js
```

---

## 7. Add package.json

In the Lambda inline editor, create a new file:

```text
package.json
```

Put exactly:

```json
{
  "type": "commonjs"
}
```

Each Lambda function must have its own `package.json`.

The final Lambda code view should contain:

```text
index.js
package.json
```

For example, the PUT Lambda contains:

```text
index.js       ← contents of server/dist/put.js
package.json   ← {"type":"commonjs"}
```

The GET, LIST, and DELETE Lambdas are configured the same way using their corresponding compiled files.

---

## 8. Deploy the Lambda

After copying the code and creating `package.json`, click:

**Deploy**

in the AWS Lambda editor.

Repeat for all four functions.

---

# API Gateway

## 9. Create the HTTP API

Open:

**API Gateway → Create API**

Choose:

**HTTP API**

Create an API for the BudgetClick storage functions.

The API Gateway endpoint itself is not used directly by the application. CloudFront provides the public `liteed.com` URL.

---

## 10. Add the PUT route

Add:

```text
PUT /budgetclick-storage/put
```

Create an integration with:

```text
budgetclick-storage-put
```

Deploy the API.

---

## 11. Add the GET route

Add:

```text
GET /budgetclick-storage/get
```

Connect it to:

```text
budgetclick-storage-get
```

Deploy.

---

## 12. Add the LIST route

Add:

```text
GET /budgetclick-storage/list
```

Connect it to:

```text
budgetclick-storage-list
```

Deploy.

---

## 13. Add the DELETE route

Add:

```text
DELETE /budgetclick-storage/delete
```

Connect it to:

```text
budgetclick-storage-delete
```

Deploy.

---

# CloudFront

The existing `liteed.com` CloudFront distribution is used for the storage API.

## 14. Add API Gateway origins

For each API, add an origin pointing to the corresponding **API Gateway invoke domain**.

Do **not** point the CloudFront origin directly to Lambda.

The origin is the API Gateway hostname shown by AWS, for example:

```text
xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

---

## 15. Create the storage origin request policy

The storage API requires these headers:

```text
X-Storage-Path
X-Storage-Key
Content-Type
```

Use the CloudFront origin request policy:

```text
BudgetClickStorage
```

Configure it to forward:

### Headers

```text
X-Storage-Key
X-Storage-Path
Content-Type
```

### Cookies

Do not forward cookies.

### Query strings

Do not forward query strings.

This policy is required because CloudFront does not automatically forward arbitrary custom headers.

---

# CloudFront behaviors

## 16. PUT

Add behavior:

```text
/budgetclick-storage/put
```

Configure:

* Origin: API Gateway PUT origin
* Allowed methods: include `PUT`
* Origin request policy: `BudgetClickStorage`

---

## 17. GET

Add behavior:

```text
/budgetclick-storage/get
```

Configure:

* Origin: API Gateway GET origin
* Allowed methods: `GET`
* Origin request policy: `BudgetClickStorage`

---

## 18. LIST

Add behavior:

```text
/budgetclick-storage/list
```

Configure:

* Origin: API Gateway LIST origin
* Allowed methods: `GET`
* Origin request policy: `BudgetClickStorage`

The correct path is:

```text
/budgetclick-storage/list
```

Be careful not to use:

```text
/budgetclick-strorage/list
```

---

## 19. DELETE

Add behavior:

```text
/budgetclick-storage/delete
```

Configure:

* Origin: API Gateway DELETE origin
* Allowed methods: include `DELETE`
* Origin request policy: `BudgetClickStorage`

---

## 20. CloudFront deployment

Wait for the CloudFront distribution to finish deploying after changing origins or behaviors.

A CloudFront invalidation is **not required** for these routing configuration changes.

---

# Testing

The complete request path is:

```text
curl
  ↓
liteed.com
  ↓
CloudFront
  ↓
API Gateway
  ↓
Lambda
  ↓
S3
```

## 21. Test LIST

Use the actual S3 bucket URL:

```bash
curl -i \
  "https://liteed.com/budgetclick-storage/list" \
  -H "X-Storage-Path: https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/"
```

A successful response is HTTP `200` with a JSON array.

For example:

```json
[
  "154f08f7",
  "326bc294",
  "6d223q6f",
  "861c43c4",
  "a028ea09",
  "c3504f34",
  "c75ac123",
  "f698f706",
  "manifest",
  "salt"
]
```

If the response is:

```json
{
  "error": "Storage path is required"
}
```

the request reached the LIST Lambda, but `X-Storage-Path` was not forwarded.

Check the CloudFront origin request policy.

If the response is:

```json
{
  "error": "Storage path and key are required"
}
```

the request is reaching the wrong Lambda/origin, such as the PUT Lambda.

Check the CloudFront behavior and origin.

If the response is:

```text
Storage request failed (404)
```

verify that `X-Storage-Path` points to the correct bucket.

---

## 22. Test PUT

Create a small test file and run:

```bash
curl -i \
  -X PUT \
  "https://liteed.com/budgetclick-storage/put" \
  -H "X-Storage-Path: https://bucket.s3.us-east-1.amazonaws.com/" \
  -H "X-Storage-Key: test" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@test.bin"
```

Replace the bucket URL with the actual S3 storage path.

---

## 23. Test GET

```bash
curl -i \
  "https://liteed.com/budgetclick-storage/get" \
  -H "X-Storage-Path: https://bucket.s3.us-east-1.amazonaws.com/" \
  -H "X-Storage-Key: test"
```

---

## 24. Test DELETE

```bash
curl -i \
  -X DELETE \
  "https://liteed.com/budgetclick-storage/delete" \
  -H "X-Storage-Path: https://bucket.s3.us-east-1.amazonaws.com/" \
  -H "X-Storage-Key: test"
```

---

# User S3 storage

The Lambda functions access the user's own S3-compatible bucket.

For example:

```text
https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/
```

No AWS credentials are required by the Lambda functions.

The bucket must allow the operations required by BudgetClick:

```text
GET
PUT
LIST
DELETE
```

The bucket configuration is documented separately in `docs/storage.md`.

---

# Storage API headers

The storage path is supplied through:

```text
X-Storage-Path
```

The object key is supplied through:

```text
X-Storage-Key
```

For example:

```text
X-Storage-Path:
https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/

X-Storage-Key:
manifest
```

The API intentionally uses headers rather than a JSON request body for these values.

---

# Lambda security

The Lambda functions are storage proxies, not general-purpose HTTP proxies.

They must validate the supplied storage URL before making an outbound request.

Only supported HTTPS S3 endpoints are accepted.

The storage key must also be validated before being used in a storage request.

No arbitrary URL fetching should be possible through these functions.

The Lambda functions do not authenticate users or provide ownership controls. The user's S3 bucket is the actual storage authority.

---
## Security

The storage path is user-controlled and untrusted; the Lambda must validate the requested location and key before any operation. BudgetClick data is encrypted before it's stored remotely.

## Local development

For local development, the storage functions can use a local filesystem instead of S3.

The local storage server uses the `storage/` directory relative to the current working directory.

Run it from the VS Code task: `[Dev] Run Local Storage Server`.

The local storage directory acts as the local equivalent of the user's remote S3 storage.