<<<<<<< HEAD
# Gazu-Fashion-Store
=======
# GAZU Fashion Store — React + Express + MongoDB

Your original GAZU storefront now has customer accounts, a persistent cart, COD orders, a mock payment API, and an admin dashboard. Start with three seeded products and add more from the admin page.

## 1. Open the project on your Mac

1. Unzip `gazu-fashion-store.zip` in Finder.
2. Keep the old project folder as a backup. Use this complete updated folder; do not copy new files into the old `src` folder.
3. Open VS Code → File → Open Folder → choose `gazu-store` (the folder containing `frontend`, `backend`, and this README).
4. Open Terminal → New Terminal in VS Code.
5. Install Node.js 24 LTS from https://nodejs.org/en/download if Node is not installed. Reopen VS Code after installing.
6. Check:

```bash
node -v
npm -v
```

Use Node 24 LTS for these instructions. No Python, virtual environment, or globally installed Express is needed.

## 2. Create your MongoDB database

Use MongoDB Atlas at https://www.mongodb.com/cloud/atlas/register . Choose the Free/M0 option when creating your cluster.

1. Create an Atlas account and a project/cluster.
2. Create a **database user** and password. This is separate from your Atlas website account and the store's admin login.
3. Add your current IP to the project's IP access list / Network Access.
4. Open the cluster's **Connect → Drivers** instructions; choose Node.js.
5. Copy the `mongodb+srv://...` connection string.
6. Replace its database username/password placeholders and use `gazu_store` as the database name before `?`.

Example shape (use your own cluster hostname):

```dotenv
MONGODB_URI=mongodb+srv://DB_USER:DB_PASSWORD@YOUR_CLUSTER.mongodb.net/gazu_store?retryWrites=true&w=majority
```

URL-encode reserved characters in the database password before putting it in a URI. Do not leave angle brackets around the password. Use a database user with read/write access to this project database. The collections appear after seeding.

**Why Atlas?** Checkout updates products, orders and the cart in one transaction. Atlas supports this; a standalone local MongoDB server does not. A local replica set is an alternative for experienced users. MongoDB Compass alone is a database viewer, not the server.

Official connection guide: https://www.mongodb.com/docs/atlas/driver-connection/

## 3. Configure the backend

From the `gazu-store` folder in the VS Code terminal:

```bash
cd backend
npm ci
cp .env.example .env
openssl rand -hex 32
```

Open **backend/.env** in VS Code. The last command prints a random secret: paste it as `JWT_SECRET`. Fill in these values:

```dotenv
PORT=8000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=YOUR_COMPLETE_ATLAS_CONNECTION_STRING
JWT_SECRET=PASTE_YOUR_RANDOM_SECRET_HERE
ADMIN_NAME=GAZU Admin
ADMIN_EMAIL=admin@gazu.local
ADMIN_PASSWORD=CHOOSE_YOUR_OWN_PASSWORD
ENABLE_MOCK_PAYMENTS=true
NODE_ENV=development
```

Choose an admin password of 8–72 characters. Use your own values; no administrator password is hard-coded in the source. Keep `.env` private. There is no frontend `.env` needed for local development.

Now create the initial admin and three products:

```bash
npm run seed
```

Expected message: `Seed complete. Sign in with the admin email and password you chose in .env.`

The seed does not delete data or reset inventory. Repeating it preserves the existing admin password. Changing `ADMIN_PASSWORD` afterward does not change a seeded account's password. Do not register the admin email through the public registration screen first.

## 4. Start the backend — terminal 1

Keep this terminal in the `backend` folder:

```bash
npm run dev
```

Expected: `GAZU API ready at http://localhost:8000`

Open http://localhost:8000/api/health — it should return `{"status":"ok"}`. Keep this terminal running.

## 5. Start the frontend — terminal 2

In VS Code click Terminal → New Terminal. If the terminal opens in `gazu-store`:

```bash
cd frontend
npm ci
npm run dev
```

If it opens in `backend`, run `cd ../frontend` instead of `cd frontend`.

Open **http://localhost:5173**. Keep both terminals running. Vite forwards `/api` requests to the backend on port 8000. Stop either process with Control+C, not Command+C.

## 6. Try the customer flow

1. Click SIGN IN → CREATE AN ACCOUNT.
2. Register with a customer email different from the admin email.
3. Browse products, use Search, category filters or price sorting.
4. Check price and availability; add an in-stock product to BAG.
5. Open BAG and change quantities or remove items.
6. Continue to checkout. Enter full name, address, city, six-digit PIN and ten-digit phone.
7. Select Cash on delivery and place the order.
8. Open MY ORDERS / TRACK ORDER to see the saved order and status.

Carts and orders persist in MongoDB. The login token stays in this browser tab for up to eight hours. Sign in again after it expires. Wishlist remains a simple in-memory convenience from the original frontend.

## 7. Try the admin flow

1. Open ACCOUNT → SIGN OUT.
2. Sign in using `ADMIN_EMAIL` and `ADMIN_PASSWORD` chosen before seeding.
3. The ADMIN dashboard opens automatically; you can also open it from ACCOUNT.
4. Add products; enter the price in rupees and quantity as a whole number.
5. Edit products to change name, price, description, category, quantity or availability.
6. Uncheck “Mark available for sale” to mark an item out of stock manually. Quantity zero is always out of stock.
7. Delete removes a product from the catalogue. Old orders retain their purchase-time details (soft deletion).
8. Scroll to ALL ORDERS and move an order through Placed → Preparing → Out for delivery → Delivered.

Customers cannot call admin APIs even if they manually change the frontend. Marking a COD order Delivered records its payment as collected in this demo.

## 8. Free mock payment API

Already implemented. **No signup, API key, card, UPI ID, or money is required.**

At checkout choose:

- Cash on delivery: saves a real project order with payment pending.
- Mock payment — simulate success: saves a project order with `mock_paid` status.
- Mock payment — simulate failure: displays a decline; creates no order and leaves stock/cart unchanged.

Endpoint: `POST /api/payments/mock/checkout`.

The “success” option is deliberately user-controlled for classroom testing. It is NOT proof of a real payment. The endpoint is disabled when `NODE_ENV=production` or `ENABLE_MOCK_PAYMENTS` is not `true`. COD remains available. See `docs/API.md` for JSON examples and notes on later real-gateway integration.

## 9. Where the code belongs

All files are already in the correct folders. No manual copy/paste is necessary.

| Location | Purpose |
| --- | --- |
| `frontend/src/main.jsx` | Original GAZU home/catalogue, navigation, cart, product modal and shared state |
| `frontend/src/styles.css` | Original styling plus responsive admin/order styles |
| `frontend/src/api.js` | Fetch helper and data adapters |
| `frontend/src/pages/Account.jsx` | Registration, login, logout and role-aware account page |
| `frontend/src/pages/Checkout.jsx` | Address form and COD/mock checkout |
| `frontend/src/pages/Orders.jsx` | Customer history and administrator fulfilment |
| `frontend/src/pages/Admin.jsx` | Product create/edit/delete form |
| `frontend/vite.config.js` | Frontend port and backend API proxy |
| `backend/src/server.js` | Startup and MongoDB connection |
| `backend/src/app.js` | Express middleware and route mounting |
| `backend/src/models/` | User, Product and Order Mongoose schemas |
| `backend/src/routes/` | Authentication, catalogue, cart, orders, admin and payments APIs |
| `backend/src/services/` | Cart and checkout transaction logic |
| `backend/src/middleware/` | JWT login checks, admin permissions, validation and errors |
| `backend/src/config/` | Environment checks and MongoDB connection |
| `backend/src/seed.js` | Initial admin and three sample products |
| `backend/tests/` | Validation and database integration tests |
| `docs/API.md` | API routes, request examples and payment extension notes |
| `docs/CHANGES.md` | Changes from your uploaded frontend and current scope |
| `docs/TESTING.md` | Verification results and manual test checklist |

Comments above the main functions explain what they do. Backend code uses ES modules (`import`/`export`) throughout. Prices are integer paise in MongoDB; the UI converts them to rupees.

## 10. Testing and build

Backend, from `backend`:

```bash
npm run test:unit
npm test
```

The full test suite downloads and starts a temporary MongoDB replica set. It does not use or erase your Atlas data. The first run needs internet and can take longer. See `docs/TESTING.md` for the verification limitations in the build environment.

Frontend, from `frontend`:

```bash
npm run build
```

For the normal local demo keep using `npm run dev`. The production build is in `frontend/dist`; deploying it needs a host/reverse proxy that also sends `/api` to Express. The Vite development proxy is not included in static production hosting.

## 11. Troubleshooting

| Problem | What to check |
| --- | --- |
| `npm: command not found` | Install Node.js LTS; reopen VS Code. |
| `ENOENT ... package.json` | You are in the wrong directory. Run commands in `backend` or `frontend`, not the root. |
| Backend cannot connect | Check URI, database user/password, current IP access and whether the Atlas cluster is available. |
| `Use MongoDB Atlas or a replica set` | Your URI points to a standalone MongoDB server. Use Atlas. |
| `JWT_SECRET` startup error | Replace the example with the output of `openssl rand -hex 32`. |
| Backend unavailable in the page | Start the backend first; check http://localhost:8000/api/health . |
| Port 5173 already in use | Stop the other Vite terminal. This project deliberately does not silently change ports. |
| Port 8000 already in use | Stop the old backend before starting this one. |
| Admin login fails | Use the values set before the successful seed, not your Atlas database credentials. |
| No products | Run `npm run seed` in backend with the correct database URI. |
| Not enough stock | Reduce cart quantity or have admin replenish stock. Checkout validates again. |
| Product image missing | Original photos are loaded from Unsplash; image loading requires internet. |
| Sign-in rate limit | Wait 15 minutes after too many attempts. |

## Scope

This is a local student project, not a deployed shop. No real payments, refunds/cancellations, size variants, file uploads, mail sending, password reset, or production hosting are included. Promotional copy/photos from the original storefront are design content, not real delivery/return promises. The newsletter explicitly remains a non-persistent demo.

React and MongoDB were added because you explicitly requested them, even though they appear below CE-1 in the syllabus. The backend demonstrates pre-CE-1 topics: Node modules/NPM, asynchronous JavaScript, Express, middleware, routing, CRUD APIs, validation, JWT, password hashing, protected routes and role-based access. It does not claim to implement every topic in that syllabus.
>>>>>>> a0de1e9 (Frontend deploy)
