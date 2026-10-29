# BudgetClick Storage Lambdas

Serverless storage proxy for BudgetClick. The browser calls `https://<domain>/<prefix>/...`.

| Environment | Domain | Path prefix | CloudFront plan |
|---|---|---|---|
| Test | `liteed.com` | `/budgetclick-storage/...` | Pay-as-you-go |
| Prod | `budgetclick.com` | `/storage/...` | Pay-as-you-go |

```text
PWA → CloudFront → API Gateway HTTP API → Lambda → user-owned S3
```

The Lambdas don't own user data and use no AWS credentials for the user's bucket.

## Source and build

Files: `server/put.ts`, `get.ts`, `list.ts`, `delete.ts`. Each exports `handler`, so the Lambda handler is `index.handler`.

Each Lambda needs its own `package.json` (compiled code is CommonJS):

```json
{ "type": "commonjs" }
```

Build with the VS Code task `[Dev] Build Server Lambdas`. Output goes to `server/dist/` (`put.js`, `get.js`, `list.js`, `delete.js`).

## Lambda setup (repeat for each function)

1. **Console → Lambda → Create function → Author from scratch**, current Node.js runtime, default architecture. Names: `budgetclick-storage-put`, `-get`, `-list`, `-delete`.
2. Set timeout to 30s. Set memory to 512MB.
3. **Runtime settings → Edit**: handler `index.handler`.
4. In the inline editor, paste the full contents of the matching `server/dist/*.js` into `index.js`, and create `package.json` with the content above. The code view should contain only `index.js` and `package.json`.
5. Click **Deploy**.

## API Gateway

Create an **HTTP API** (CloudFront provides the public URL, so the API endpoint isn't used directly). Add these routes, each integrated with its Lambda, and deploy.

| Route (test) | Route (prod) | Lambda |
|---|---|---|
| `POST /budgetclick-storage/put` | `POST /storage/put` | `budgetclick-storage-put` |
| `GET /budgetclick-storage/get` | `GET /storage/get` | `budgetclick-storage-get` |
| `GET /budgetclick-storage/list` | `GET /storage/list` | `budgetclick-storage-list` |
| `DELETE /budgetclick-storage/del` | `DELETE /storage/del` | `budgetclick-storage-delete` |

## CloudFront

1. Add an origin for each API pointing to its **API Gateway invoke domain** (e.g. `xxxxxxxxxx.execute-api.us-east-1.amazonaws.com`), never directly to Lambda.
2. Choose the **origin request policy** (see below). It must forward `X-Storage-Path`, `X-Storage-Key` and `Content-Type`, but not `Host`.
3. Add a behavior per route (CloudFront can't allow a single method: for `POST`/`DELETE` use the full method set, `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`), using the matching origin, the origin request policy from step 2, and the `Managed-CachingDisabled` cache policy:
   * `<prefix>/put`: allow `POST`
   * `<prefix>/get`: allow `GET`
   * `<prefix>/list`: allow `GET` (watch the spelling: not `strorage`)
   * `<prefix>/del`: allow `DELETE`
4. Path patterns have **no trailing slash** (`/storage/get`, not `/storage/get/`), or they won't match.
5. Wait until the distribution is **Deployed** before testing.

### Plan

Use the **Pay-as-you-go** plan. The Free plan's bundled WAF blocks request bodies over ~8 KB (8000 B passes, 8200 B fails), which breaks `/storage/put`, and the `403` error mapping shows it as the site's 404 page. Set an AWS Budgets alert and API Gateway throttling, since the endpoints are unauthenticated.

### Origin request policy

Custom `BudgetClickStorage`, or the managed `Managed-AllViewerExceptHostHeader`. Never use `Managed-AllViewer`: it forwards `Host`, and API Gateway returns `403`.

## Testing

```bash
H='X-Storage-Path: https://bucket.s3.us-east-1.amazonaws.com/'
U=https://liteed.com/budgetclick-storage     # test; prod: https://budgetclick.com/storage

curl -i "$U/list" -H "$H"                                   # LIST: 200 + JSON array of keys
curl -i -X POST "$U/put" -H "$H" -H "X-Storage-Key: test" \
  -H "Content-Type: application/octet-stream" --data-binary @test.bin
curl -i "$U/get" -H "$H" -H "X-Storage-Key: test" --output -
curl -i -X DELETE "$U/del" -H "$H" -H "X-Storage-Key: test"
```

## Storage and API

The Lambdas access the user's own S3-compatible bucket, which must allow GET, PUT, LIST, and DELETE (see `docs/storage.md`). The storage URL goes in the `X-Storage-Path` header and the object key in `X-Storage-Key`. Headers are used intentionally instead of a JSON body.

## Security

* The storage path and key are user-controlled and untrusted. Validate both before any request.
* Accept only supported HTTPS S3 endpoints. No arbitrary URL fetching.
* The Lambdas don't authenticate users. The user's S3 bucket is the storage authority.
* BudgetClick data is encrypted before remote storage.

## Local development

Storage functions can use the local filesystem (`storage/` in the working directory) instead of S3. Run the VS Code task `[Dev] Run Local Storage Server`.