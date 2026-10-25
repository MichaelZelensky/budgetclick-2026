# BudgetClick Storage Lambdas

Serverless storage proxy for BudgetClick. The browser calls `https://liteed.com/budgetclick-storage/...`

```text
PWA → CloudFront (liteed.com) → API Gateway HTTP API → Lambda → user-owned S3
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

Create an **HTTP API** (CloudFront provides the public URL, so the API endpoint isn't used directly). Add these routes, each integrated with its Lambda, and deploy:

| Route | Lambda |
|---|---|
| `PUT /budgetclick-storage/put` | `budgetclick-storage-put` |
| `GET /budgetclick-storage/get` | `budgetclick-storage-get` |
| `GET /budgetclick-storage/list` | `budgetclick-storage-list` |
| `DELETE /budgetclick-storage/del` | `budgetclick-storage-delete` |

## CloudFront (existing `liteed.com` distribution)

1. Add an origin for each API pointing to its **API Gateway invoke domain** (e.g. `xxxxxxxxxx.execute-api.us-east-1.amazonaws.com`), never directly to Lambda.
2. Create origin request policy `BudgetClickStorage`. Forward headers `X-Storage-Path`, `X-Storage-Key`, `Content-Type`. Forward no cookies and no query strings. (CloudFront doesn't forward custom headers by default.)
3. Add a behavior per route, using the matching origin and the `BudgetClickStorage` policy:
   * `/budgetclick-storage/put`: allow `PUT`
   * `/budgetclick-storage/get`: allow `GET`
   * `/budgetclick-storage/list`: allow `GET` (watch the spelling: not `strorage`)
   * `/budgetclick-storage/del`: allow `DELETE`
4. Wait for the distribution to finish deploying. No invalidation is needed.

## Testing

Use your real bucket URL, such as `https://budgetclick-pwa-storage.s3.us-east-1.amazonaws.com/`.

```bash
H='X-Storage-Path: https://bucket.s3.us-east-1.amazonaws.com/'
U=https://liteed.com/budgetclick-storage

curl -i "$U/list" -H "$H"                                   # LIST: 200 + JSON array of keys
curl -i -X PUT "$U/put" -H "$H" -H "X-Storage-Key: test" \
  -H "Content-Type: application/octet-stream" --data-binary @test.bin
curl -i "$U/get" -H "$H" -H "X-Storage-Key: test"
curl -i -X DELETE "$U/del" -H "$H" -H "X-Storage-Key: test"
```

LIST troubleshooting:

* `"Storage path is required"`: `X-Storage-Path` wasn't forwarded, so check the origin request policy.
* `"Storage path and key are required"`: the request hit the wrong Lambda (e.g. PUT), so check the behavior and origin.
* `Storage request failed (404)`: `X-Storage-Path` points to the wrong bucket.

## Storage and API

The Lambdas access the user's own S3-compatible bucket, which must allow GET, PUT, LIST, and DELETE (see `docs/storage.md`). The storage URL goes in the `X-Storage-Path` header and the object key in `X-Storage-Key`. Headers are used intentionally instead of a JSON body.

## Security

* The storage path and key are user-controlled and untrusted. Validate both before any request.
* Accept only supported HTTPS S3 endpoints. No arbitrary URL fetching.
* The Lambdas don't authenticate users. The user's S3 bucket is the storage authority.
* BudgetClick data is encrypted before remote storage.

## Local development

Storage functions can use the local filesystem (`storage/` in the working directory) instead of S3. Run the VS Code task `[Dev] Run Local Storage Server`.