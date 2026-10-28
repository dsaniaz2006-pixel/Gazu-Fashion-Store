# Verification and local test checklist

Verified on 27 October 2026 using Node 24.22.1.

## Completed

- Dependencies installed successfully for frontend and backend; lockfiles included.
- `npm run build` in frontend passed.
- `npm run test:unit` in backend: **11 tests passed**.
- Tests cover quantity bounds, integer prices, stock validation, allowed product fields, safe image IDs, checkout address fields, rejection of client totals/user IDs, health JSON, authentication guards, registration role injection, invalid IDs and unknown routes.

## Blocked in the build environment

The 10 database integration tests in `backend/tests/api.test.js` could not execute their assertions because the temporary MongoDB process was denied startup with `open: Operation not permitted` (exit code 100). They are included but are **not claimed to pass**. They cover password hashing/login, admin CRUD/authorization, cart persistence, server prices, order ownership, transaction rollback, final-unit concurrency, repeated checkout, mock payments and status transitions.

Browser automation was also blocked when Chromium startup attempted an operation disallowed by this environment. Responsive styles are included, but visual/browser end-to-end verification is **not complete**.

Run the full suite on your Mac before presenting the project:

```bash
cd backend
npm test
```

This starts a disposable MongoDB replica set and never connects to the database from `.env`. First run downloads a MongoDB binary and needs internet. No test clears your Atlas database.

## Manual check after following README setup

1. Confirm the three seeded products appear at http://localhost:5173 .
2. Register a customer; confirm signing out/in restores their cart.
3. Use search/category/price sorting; open product details.
4. Add an item; increase/decrease quantity; remove it; verify invalid stock cannot be purchased.
5. Place a COD order and verify order history, total and inventory decrease.
6. Place a mock-success order; verify it is labelled mock paid and no money is requested.
7. Simulate a failed mock payment; verify no order appears and the bag/stock remain unchanged.
8. Sign in as a second customer; confirm they cannot view the first customer's orders.
9. Sign in as the seeded admin; add, edit and delete a test product.
10. Set quantity to zero, and separately uncheck availability while quantity is positive. Confirm both show out of stock.
11. Advance an order through Preparing, Out for delivery and Delivered. Sign in as its customer and refresh history to check the change.
12. Check at a narrow/mobile window width and confirm form fields remain usable.

Do not treat a passing frontend build or unit tests as proof that the complete database workflow has passed. Complete the checks above with your own configured database.
