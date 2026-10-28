# GAZU API

Development base URL: `http://localhost:8000/api`.
All JSON request bodies use `Content-Type: application/json`.
For protected routes add `Authorization: Bearer YOUR_TOKEN`. Get a token from registration or login.
Errors are JSON: `{ "message": "Explanation" }`.

## Routes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Backend readiness after initial DB connection |
| POST | `/auth/register` | Public | Create customer account |
| POST | `/auth/login` | Public | Customer/admin login |
| GET | `/auth/me` | Signed in | Current public account fields |
| GET | `/products` | Public | Active catalogue including sold-out items |
| GET | `/products/:id` | Public | Product detail |
| GET | `/cart` | Signed in | Persisted cart with current product records |
| POST | `/cart/items` | Signed in | Add quantity to a cart product |
| PATCH | `/cart/items/:id` | Signed in | Set product's cart quantity |
| DELETE | `/cart/items/:id` | Signed in | Remove product from cart |
| POST | `/orders/checkout` | Signed in | COD checkout |
| GET | `/orders` | Signed in | Own orders only |
| GET | `/orders/:id` | Signed in | Own order detail only |
| GET | `/payments/config` | Public | Whether mock payments are enabled |
| POST | `/payments/mock/checkout` | Signed in, mock enabled | Simulate success/failure |
| GET | `/admin/products` | Admin | Active inventory |
| POST | `/admin/products` | Admin | Add product |
| PATCH | `/admin/products/:id` | Admin | Update product (send the complete editor body) |
| DELETE | `/admin/products/:id` | Admin | Soft-delete product; returns 204 |
| GET | `/admin/orders` | Admin | All orders with customer details |
| PATCH | `/admin/orders/:id/status` | Admin | Advance fulfilment status |

`:id` in cart endpoints is the **product ID**, not a separate cart-row ID. Search/filter/sort is client-side because this version has only a few products. No API pagination is implemented.

## Register / login

Registration:

```json
{"name":"Demo Customer","email":"customer@example.com","password":"ChooseYourPassword123"}
```

Login uses just `email` and `password`. Both return:

```json
{"token":"SIGNED_JWT","user":{"id":"MONGODB_ID","name":"Demo Customer","email":"customer@example.com","role":"customer"}}
```

Never send `role` during registration. Administrators are created by the seed script. Passwords are hashed with bcrypt. Public responses do not include password hashes. JWT expiry is eight hours; logout deletes the token from this tab. Tokens already copied elsewhere are not revoked on logout; production deployments should add revocable sessions and secure HttpOnly cookies.

## Product create/edit

```json
{
  "name":"Relaxed Cotton Tee",
  "description":"An everyday cotton tee.",
  "category":"Men",
  "type":"T-Shirts",
  "color":"Stone",
  "tag":"NEW",
  "img":"photo-1521572163474-6864f9cf17ab",
  "pricePaise":129900,
  "quantity":12,
  "inStock":true
}
```

`129900` paise = ₹1,299. Categories are Men, Women, Kids and Accessories. An item is purchasable only when `active && inStock && quantity > 0`. PATCH uses the full form body intentionally to keep beginner code simple. Do not send `_id`, `active`, or timestamps.

## Cart

Add: `POST /cart/items`:

```json
{"productId":"COPY_ID_FROM_PRODUCTS_RESPONSE","quantity":1}
```

Change: `PATCH /cart/items/PRODUCT_ID` with `{"quantity":2}`. Quantity must be an integer from 1 to 99; DELETE removes a line. The cart stores product references, not client-controlled prices. Product deletion is soft so old cart lines can still be removed.

## COD checkout

`POST /orders/checkout`:

```json
{
  "requestId":"861fd91a-0ad8-4d8a-a6e1-e0f01bb99964",
  "shipping":{
    "name":"Demo Customer",
    "address":"12 Test Road",
    "city":"Chandigarh",
    "pin":"160001",
    "phone":"9876543210"
  }
}
```

Generate a new UUID for each new order (`crypto.randomUUID()` in the browser). Reuse it when retrying the same checkout after a network failure. Do not send totals, item prices, a user ID or payment status.

The server reads the account's cart, uses current database prices, conditionally decrements stock, creates the order and clears the cart inside one MongoDB transaction. Failure rolls everything back. Delivery is ₹99 below ₹999 subtotal and free at ₹999 or above. There is no separate tax calculation. The successful response is the order document (HTTP 201) with `_id`, `items`, `shipping`, `subtotalPaise`, `deliveryPaise`, `totalPaise`, `status`, `paymentMethod` and `paymentStatus`.

## Free mock payment API

`POST /payments/mock/checkout`: send the same body plus `"outcome":"success"` or `"outcome":"failure"`.

- Success calls the same transaction-safe checkout service, sets `paymentMethod` to `mock` and `paymentStatus` to `mock_paid`, and returns the order (201).
- Failure returns 402 with a message; it does not create an order, decrement stock or clear the cart.
- Mock disabled or production environment returns 403.
- The API neither requests nor stores bank/card/UPI credentials. It needs no third-party account or key.

This is a local simulation, not a gateway integration. Later, add a real provider's server-side payment creation, signature verification and verified webhook handler. Only the backend should mark an order paid after verification. Do not enable this mock endpoint to accept real payments. Designing real payment reservations, refund handling and webhook idempotency is a separate extension.

## Status updates

`PATCH /admin/orders/ORDER_ID/status` with one of:

```json
{"status":"preparing"}
```

Then `out_for_delivery`, then `delivered`. Skips and backward changes return 409. COD delivery also records `paymentStatus: collected` atomically. Mock orders remain `mock_paid`.

## HTTP errors

400 invalid fields / empty cart; 401 missing/expired token or bad login; 402 mock decline; 403 wrong role / disabled mock; 404 resource missing or not owned; 409 duplicate email / unavailable stock / invalid status transition; 429 too many authentication attempts; 500 unexpected server failure.
