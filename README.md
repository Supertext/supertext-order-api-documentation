# Supertext Order API

Documentation for the **Supertext Order API** — the HTTP API used to place and
manage **professional (human) translation orders** with Supertext, upload the
content to translate, receive a completion callback, and download the finished
translation.

> This is the API also referred to as the **Legacy API** (Basic-auth order
> endpoints under `/api/v1` and `/api/v1.1`). A newer OAuth2-based API exists for
> some operations; where both are available this document describes the Basic-auth
> flow, which is what most integrations use.

📖 **Browse the rendered reference:**
**<https://supertext.github.io/supertext-order-api-documentation/>** — an interactive,
three-pane API reference generated from `openapi.json`.

**In this repository**

| File | What it is |
|------|------------|
| `README.md` | This guide. |
| `openapi.json` | Machine-readable OpenAPI 3.0 specification (import into Swagger UI, Postman, code generators, etc.). It also drives the [rendered reference site](https://supertext.github.io/supertext-order-api-documentation/). |
| `Supertext Order API 2026.postman_collection.json` | Ready-to-run Postman collection (credentials removed — see [Authentication](#authentication)). |
| `app/` | Next.js source for the [rendered reference site](https://supertext.github.io/supertext-order-api-documentation/) (auto-deployed to GitHub Pages on push to `main`). |

---

## Table of contents

- [Concepts](#concepts)
- [Base URLs & environments](#base-urls--environments)
- [Authentication](#authentication)
- [The typical order flow](#the-typical-order-flow)
- [Endpoints](#endpoints)
  - [Account check](#account-check)
  - [Upload a file](#upload-a-file)
  - [Get a quote](#get-a-quote)
  - [Create an order](#create-an-order)
  - [Get an order](#get-an-order)
  - [List files for an order](#list-files-for-an-order)
  - [Download a file](#download-a-file)
  - [Provide feedback / reject an order](#provide-feedback--reject-an-order)
  - [List the current person's orders](#list-the-current-persons-orders)
  - [Change an order's status](#change-an-orders-status)
- [The completion callback (webhook)](#the-completion-callback-webhook)
- [Providing content: Groups vs Files](#providing-content-groups-vs-files)
- [Reference values](#reference-values)
- [Errors](#errors)
- [A complete worked example](#a-complete-worked-example)

---

## Concepts

- **Order** — a professional translation job. One request to *create an order* with
  several target languages produces **one order object per target language**, each
  with its own numeric `Id` (the **OrderId**).
- **Document / File** — the content to translate. You either send the content
  **inline** in the order body (`Groups`), or **upload a file first** and reference
  its `Id` (`Files`). Uploaded and produced files each have a numeric id
  (**DocumentId** / **FileId**).
- **Callback** — when an order is completed, Supertext performs an HTTP `POST` to the
  `CallbackUrl` you supplied, with the order object(s). The finished file(s) are
  listed with `DocumentType: "Final"` and can then be downloaded.
- **ReferenceData** — an opaque string you attach to an order. Supertext echoes it
  back unchanged in the callback, so you can correlate the callback with your own
  system (ticket id, post id, a signed token, …).

---

## Base URLs & environments

All environments live under `supertext.com`:

| Environment | Base URL |
|-------------|----------|
| **Production (live)** | `https://www.supertext.com/` |
| **Staging** | `https://staging.supertext.com/` |
| **Testing** | `https://testing.supertext.com/` |

Use **Staging** or **Testing** for integration work — orders there are not billed
and not actually translated by humans.

> **Historical note:** older examples sometimes use the `supertext.ch` domain
> (e.g. `staging.supertext.ch`). Prefer the `supertext.com` hosts above.

All endpoint paths in this document are **relative to the environment base URL**.

---

## Authentication

The Order API uses **HTTP Basic authentication**:

- **username** = your Supertext **account email**
- **password** = your **Legacy API Key** (found in your Supertext account settings)

Send it on every request as an `Authorization` header:

```
Authorization: Basic BASE64( "email:legacyApiKey" )
```

For example, `jane@example.com:my-api-key` becomes:

```
Authorization: Basic amFuZUBleGFtcGxlLmNvbTpteS1hcGkta2V5
```

```bash
curl -u "jane@example.com:my-api-key" \
  https://staging.supertext.com/api/v1/translation/accountcheck
```

> **Never commit real credentials.** The Postman collection in this repo ships with
> empty credentials; set them via the collection variables `email` and `apiKey`
> (Collection → Variables), or per-request. Rotate any key that has ever been shared
> or committed.

---

## The typical order flow

```
1. (optional) GET  /api/v1/translation/accountcheck     → verify credentials
2. (optional) POST /api/v1/files/files                  → upload content, get DocumentId
3. (optional) POST /api/v1/translation/quote            → price/word count preview
4.            POST /api/v1.1/translation/order           → create the order(s)
                          │
                          ▼  (minutes … days later)
5. Supertext POST  {your CallbackUrl}                    → order completed
6.            GET  /storage/file/{FileId}/{Name}         → download the "Final" file(s)
7. (optional) PUT  /api/v1/order/status/{OrderId}/9      → mark as collected
```

Steps 2 and 4 can each carry the content, so a minimal integration is just
**upload → order → (callback) → download**.

---

## Endpoints

Common headers for JSON endpoints:

```
Accept: application/json
Content-Type: application/json; charset=UTF-8
Authorization: Basic …
```

### Account check

Verify that the credentials are valid.

```
GET /api/v1/translation/accountcheck
```

```bash
curl -u "$EMAIL:$KEY" https://staging.supertext.com/api/v1/translation/accountcheck
```

A `2xx` response means the credentials are accepted.

---

### Upload a file

Upload the document to be translated. `multipart/form-data`.

```
POST /api/v1/files/files
Content-Type: multipart/form-data
```

**Form fields**

| Field | Value | Meaning |
|-------|-------|---------|
| `ElementId` | `0` | New element. |
| `ElementTypeId` | `2` | File element. |
| `DocumentTypeId` | `1` | Original (source) document. |
| `file` | *(binary)* | The file. Use a real filename and content type (e.g. `content.html`, `text/html`). |

```bash
curl -u "$EMAIL:$KEY" \
  -F "ElementId=0" \
  -F "ElementTypeId=2" \
  -F "DocumentTypeId=1" \
  -F "file=@content.html;type=text/html" \
  https://staging.supertext.com/api/v1/files/files
```

**Response** — a JSON array of the uploaded document object(s). Take the returned
`Id` — this is the **DocumentId** you reference from the order's `Files` array.

```json
[ { "Id": 3538699, "Name": "content.html", "DocumentType": "Original" } ]
```

---

### Get a quote

Get an estimated price / word count without placing an order. Same body shape as
*create an order* (content via `Groups` or `Files`).

```
POST /api/v1/translation/quote
```

```jsonc
{
  "ContentType": "text/html",
  "Currency": "chf",
  "DeliveryId": 2,
  "OrderName": "Some title",
  "ServiceTypeId": 46,
  "SourceLang": "de-CH",
  "TargetLanguages": ["fr-CH", "en-US"],
  "Files": [ { "Id": 3538699, "Comment": "The main story" } ]
}
```

---

### Create an order

Place the translation order. **This is the core endpoint.** Note the **`v1.1`** path.

```
POST /api/v1.1/translation/order
```

Optional query parameter: `?suppressConfirmationEmail=true` to suppress the order
confirmation email.

**Body fields**

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `OrderTypeConfigurationId` | int | ✅ | The product/quality tier. **Account-specific** — see [Reference values](#reference-values). |
| `DeliveryId` | int | ✅ | Delivery speed. See [Reference values](#reference-values). |
| `SourceLang` | string | ✅ | Source language. 2-letter (`de`) or regional (`de-CH`). |
| `TargetLanguages` | string[] | ✅ | One or more target languages, e.g. `["fr-CH","en-US"]`. Produces one order per language. |
| `OrderName` | string | ✅ | Human-readable order title. |
| `Groups` **or** `Files` | array | ✅ | The content to translate — see [Groups vs Files](#providing-content-groups-vs-files). |
| `ContentType` | string | – | e.g. `"text/html"`. |
| `CallbackUrl` | string | – | URL Supertext `POST`s to on completion. See [callback](#the-completion-callback-webhook). |
| `ReferenceData` | string | – | Opaque correlation string, echoed back in the callback. |
| `Links` | array | – | Reference links for the translator: `{ "Url", "Comment" }`. |
| `AdditionalInformation` | string | – | Free-text instructions for the translator. |
| `Currency` | string | – | e.g. `"chf"`. |
| `Deadline` | string | – | ISO-8601 desired deadline. |
| `Referrer` | string | – | Free-text source of the order. |
| `SystemName`, `SystemVersion`, `ComponentName`, `ComponentVersion` | string | – | Integration identification (recommended). |

```bash
curl -u "$EMAIL:$KEY" \
  -H "Content-Type: application/json; charset=UTF-8" \
  -X POST https://staging.supertext.com/api/v1.1/translation/order \
  -d '{
    "OrderTypeConfigurationId": 6,
    "DeliveryId": 1,
    "OrderName": "Homepage translation",
    "SourceLang": "de",
    "TargetLanguages": ["fr-CH", "en-US"],
    "ContentType": "text/html",
    "CallbackUrl": "https://yourdomain.com/supertext/callback",
    "ReferenceData": "ticket-4711",
    "Files": [ { "Id": 3538699, "Comment": "File to translate" } ]
  }'
```

**Response** — a JSON **array** with one order object per target language. Each
object's `Id` is the **OrderId**; store it to reconcile the callback later.

```json
[
  { "Id": 715113, "TargetLang": "fr-CH", "Status": "New", "ReferenceData": "ticket-4711" },
  { "Id": 715114, "TargetLang": "en-US", "Status": "New", "ReferenceData": "ticket-4711" }
]
```

---

### Get an order

Fetch a single order with its current status and files.

```
GET /api/v1/order/{orderId}
```

```bash
curl -u "$EMAIL:$KEY" https://staging.supertext.com/api/v1/order/715113
```

The response includes the order's `Status` and a `Files` array; completed
translations appear with `DocumentType: "Final"`.

---

### List files for an order

```
GET /api/v1/files/files/{orderId}
```

Returns the file objects associated with an order.

---

### Download a file

Download a document (e.g. the finished `Final` file named in the order/callback).

```
GET /storage/file/{fileId}/{fileName}
```

```bash
curl -u "$EMAIL:$KEY" -OJ \
  https://staging.supertext.com/storage/file/1964676/translation.html
```

> Some environments/older integrations expose the same download under
> `GET /filedownloads/file/{fileId}/{fileName}`.

---

### Provide feedback / reject an order

Send a rating and/or comments, or reject a delivered order.

```
POST /api/v1/order/feedback
```

```json
{
  "OrderId": 168110,
  "PostEditing": "true",
  "Rating": 4,
  "Comments": [ { "Comment": "Please keep the product name untranslated." } ]
}
```

---

### List the current person's orders

Paged list of the authenticated person's orders.

```
GET /api/v1/customer/orders/current/{pageSize}/{page}/{personId}
```

Optional filter to exclude certain statuses:
`?queryFilter[IgnoreOrderStatusIds][]={statusId}`

```bash
curl -u "$EMAIL:$KEY" \
  "https://staging.supertext.com/api/v1/customer/orders/current/50/1/598?queryFilter[IgnoreOrderStatusIds][]=22"
```

---

### Change an order's status

```
PUT /api/v1/order/status/{orderId}/{statusId}
```

Most commonly used to mark a collected/handled order as **Collected** (`statusId` = `9`):

```bash
curl -u "$EMAIL:$KEY" -X PUT \
  https://staging.supertext.com/api/v1/order/status/673198/9
```

---

## The completion callback (webhook)

If you supply a `CallbackUrl` when creating the order, Supertext performs an HTTP
`POST` to it when the order is completed. The request body is the **order
object(s)** — the same shape returned by *create an order*, now including the
finished files.

Key points:

- The body may be a **single order object or an array** of them — handle both.
- Your `ReferenceData` is included unchanged — use it to authenticate/correlate the
  callback with your system. (A common pattern is to make `ReferenceData` a signed
  token so a public callback endpoint can verify the call is genuine.)
- The finished translation is the file whose `DocumentType` is **`"Final"`**
  (as opposed to `"Original"`). Download it via
  [`GET /storage/file/{fileId}/{fileName}`](#download-a-file).
- Respond `2xx` to acknowledge receipt.

**Example callback body**

```json
{
  "Id": 715113,
  "Status": "Completed",
  "ReferenceData": "ticket-4711",
  "SourceLang": "de",
  "TargetLang": "fr-CH",
  "Files": [
    { "Id": 8811, "Name": "content.html", "DocumentType": "Original", "ContentType": "text/html" },
    { "Id": 8812, "Name": "content.html", "DocumentType": "Final",    "ContentType": "text/html" }
  ]
}
```

---

## Providing content: Groups vs Files

You can send the content to translate in **two ways**. Use exactly one per order.

### `Files` — reference an uploaded document

Upload with [`POST /api/v1/files/files`](#upload-a-file), then reference the id:

```json
"Files": [ { "Id": 3538699, "Comment": "Main story" } ]
```

### `Groups` — inline content

Structured content embedded directly in the order body. Each **group** has an id and
a list of **items**; each item has an id and its `Content`. The same ids come back on
the translated side so you can map translations onto your original structure.

```json
"Groups": [
  {
    "Context": "Some Node",
    "GroupId": "Group1",
    "Items": [
      { "Id": "1", "Content": "<div>This is the content of group 1</div>", "Comment": null, "Context": null },
      { "Id": "2", "Content": "This is <i>new</i> content of group 1",     "Comment": null, "Context": null }
    ]
  }
]
```

| Field | Level | Description |
|-------|-------|-------------|
| `GroupId` | group | Your identifier for the group. |
| `Context` | group / item | Optional context shown to the translator. |
| `Items[].Id` | item | Your identifier for the string (returned unchanged). |
| `Items[].Content` | item | The text/HTML to translate. |
| `Items[].Comment` | item | Optional per-item comment. |

---

## Reference values

> ⚠️ **Product ids are account-specific.** `OrderTypeConfigurationId` (and legacy
> `ServiceTypeId`) values depend on the products configured for your account. The
> values below are examples/known values — confirm yours with Supertext or via a
> quote. `DeliveryId` and the upload constants are stable.

### `DeliveryId`

| Id | Delivery |
|----|----------|
| 1 | Express |
| 2 | 24 hours |
| 3 | 48 hours |
| 4 | 3 days |
| 5 | 1 week |

### `OrderTypeConfigurationId` (example values)

| Id | Product |
|----|---------|
| 166 | Translation BASIC |
| 167 | Translation PREMIUM |
| 168 | Translation CREATIVE |

*(Other accounts may use different ids — e.g. `6` appears in the sample requests.)*

### `ServiceTypeId`

Legacy service-type selector used by the **[quote](#get-a-quote)** endpoint
(`POST /api/v1/translation/quote`). Like `OrderTypeConfigurationId`, its values are
**account-specific**. When creating an order you use `OrderTypeConfigurationId` instead —
`ServiceTypeId` is not required on the order endpoint.

| Id | Service |
|----|---------|
| 46 | Standard |

> These ids can be **client-specific** — confirm the `ServiceTypeId` values available to
> your account with Supertext.

### Upload constants (`POST /api/v1/files/files`)

| Field | Value | Meaning |
|-------|-------|---------|
| `ElementId` | `0` | New element |
| `ElementTypeId` | `2` | File |
| `DocumentTypeId` | `1` | Original document |

### `DocumentType` (in responses)

| Id | Value | Meaning |
|----|-------|---------|
| 1 | `Original` | The source document you supplied. |
| 2 | `Final` | The finished translation to download. |

### Order status (partial)

Order objects carry a textual `Status` (e.g. `New`, `In progress`, `Quality check`),
backed by a numeric status id.

| Status id | Meaning |
|-----------|---------|
| 8 | **Delivered** — the order is finished. **Poll for this** when waiting for a completed order. |
| 9 | Collected |

> **Waiting for a finished order:** either supply a `CallbackUrl` (Supertext POSTs the
> completed order to it), or poll [`GET /api/v1/order/{orderId}`](#get-an-order) until the
> status reaches **Delivered (8)**, then download the `Final` (2) file(s).

---

## Errors

- Authentication problems return **`401 Unauthorized`**.
- Validation problems return a **`4xx`** with a JSON or text body describing the
  issue.
- Always check the HTTP status code; a non-`2xx` response means the operation did
  not succeed, and the body usually carries a human-readable message.

---

## A complete worked example

```bash
BASE=https://staging.supertext.com
AUTH=(-u "jane@example.com:my-api-key")

# 1. Verify credentials
curl "${AUTH[@]}" "$BASE/api/v1/translation/accountcheck"

# 2. Upload the content, capture the DocumentId
DOC_ID=$(curl -s "${AUTH[@]}" \
  -F "ElementId=0" -F "ElementTypeId=2" -F "DocumentTypeId=1" \
  -F "file=@content.html;type=text/html" \
  "$BASE/api/v1/files/files" | python -c 'import sys,json;print(max(d["Id"] for d in json.load(sys.stdin)))')

# 3. Create the order(s)
curl "${AUTH[@]}" -H "Content-Type: application/json; charset=UTF-8" \
  -X POST "$BASE/api/v1.1/translation/order" \
  -d "{
    \"OrderTypeConfigurationId\": 6,
    \"DeliveryId\": 1,
    \"OrderName\": \"Homepage\",
    \"SourceLang\": \"de\",
    \"TargetLanguages\": [\"fr-CH\"],
    \"ContentType\": \"text/html\",
    \"CallbackUrl\": \"https://yourdomain.com/supertext/callback\",
    \"ReferenceData\": \"ticket-4711\",
    \"Files\": [ { \"Id\": $DOC_ID, \"Comment\": \"Main story\" } ]
  }"

# 4. …later, your CallbackUrl receives the completed order.
#    Download the "Final" file:
curl "${AUTH[@]}" -OJ "$BASE/storage/file/8812/content.html"
```
