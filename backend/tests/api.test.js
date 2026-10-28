import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import app from "../src/app.js";

let db, customer, second, admin, product;
const shipping = {
  name: "Demo Customer",
  address: "12 Test Road",
  city: "Chandigarh",
  pin: "160001",
  phone: "9876543210",
};
const productBody = {
  name: "Cotton Tee",
  description: "Test item",
  category: "Men",
  type: "T-Shirts",
  color: "Stone",
  tag: "",
  img: "photo-1521572163474-6864f9cf17ab",
  pricePaise: 129900,
  quantity: 3,
  inStock: true,
};
// All test records live in a temporary replica set, never the user's database.
before(async () => {
  process.env.JWT_SECRET = "test-only-secret-with-more-than-32-characters";
  process.env.ENABLE_MOCK_PAYMENTS = "true";
  process.env.NODE_ENV = "test";
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri());
  await Promise.all([User.init(), Product.init(), Order.init()]);
});
after(async () => {
  await mongoose.disconnect();
  if (db) await db.stop();
});
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);
  const passwordHash = await bcrypt.hash("Password123!", 4);
  await User.create([
    { name: "Customer", email: "customer@test.local", passwordHash },
    { name: "Second", email: "second@test.local", passwordHash },
    { name: "Admin", email: "admin@test.local", passwordHash, role: "admin" },
  ]);
  const token = async (email) =>
    jwt.sign({}, process.env.JWT_SECRET, {
      subject: (await User.findOne({ email })).id,
      expiresIn: "8h",
    });
  [customer, second, admin] = await Promise.all(
    ["customer@test.local", "second@test.local", "admin@test.local"].map(token),
  );
  product = await Product.create(productBody);
});
const auth = (token) => `Bearer ${token}`;
const add = (token, id = product.id, quantity = 1) =>
  request(app)
    .post("/api/cart/items")
    .set("Authorization", auth(token))
    .send({ productId: id, quantity });
const buy = (token, requestId = randomUUID()) =>
  request(app)
    .post("/api/orders/checkout")
    .set("Authorization", auth(token))
    .send({ requestId, shipping });

test("registration hashes passwords and never permits self-assigned admin role", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Hacker",
      email: "bad@test.local",
      password: "Password123!",
      role: "admin",
    })
    .expect(400);
  const result = await request(app)
    .post("/api/auth/register")
    .send({
      name: "New User",
      email: "new@test.local",
      password: "Password123!",
    })
    .expect(201);
  assert.equal(result.body.user.role, "customer");
  assert.equal(result.body.passwordHash, undefined);
  const user = await User.findOne({ email: "new@test.local" }).select(
    "+passwordHash",
  );
  assert.notEqual(user.passwordHash, "Password123!");
  assert.ok(await bcrypt.compare("Password123!", user.passwordHash));
  await request(app)
    .post("/api/auth/login")
    .send({ email: "new@test.local", password: "Password123!" })
    .expect(200);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "new@test.local", password: "WrongPass123" })
    .expect(401);
});
test("admin CRUD, public availability, and protected role access", async () => {
  await request(app).get("/api/admin/products").expect(401);
  await request(app)
    .post("/api/admin/products")
    .set("Authorization", auth(customer))
    .send(productBody)
    .expect(403);
  const created = await request(app)
    .post("/api/admin/products")
    .set("Authorization", auth(admin))
    .send(productBody)
    .expect(201);
  await request(app)
    .patch(`/api/admin/products/${created.body._id}`)
    .set("Authorization", auth(admin))
    .send({ ...productBody, inStock: false, quantity: 5 })
    .expect(200);
  await add(customer, created.body._id).expect(409);
  await request(app)
    .delete(`/api/admin/products/${created.body._id}`)
    .set("Authorization", auth(admin))
    .expect(204);
  await request(app).get(`/api/products/${created.body._id}`).expect(404);
});
test("cart persists per account and rejects invalid/oversized quantities", async () => {
  await add(customer, product.id, 0).expect(400);
  await add(customer, product.id, -1).expect(400);
  await add(customer, product.id, 4).expect(409);
  await add(customer, product.id, 2).expect(200);
  const cart = await request(app)
    .get("/api/cart")
    .set("Authorization", auth(customer))
    .expect(200);
  assert.equal(cart.body[0].quantity, 2);
  assert.equal(
    (await request(app).get("/api/cart").set("Authorization", auth(second)))
      .body.length,
    0,
  );
  await request(app)
    .patch(`/api/cart/items/${product.id}`)
    .set("Authorization", auth(customer))
    .send({ quantity: 1 })
    .expect(200);
  await request(app)
    .delete(`/api/cart/items/${product.id}`)
    .set("Authorization", auth(customer))
    .expect(200);
  assert.equal(
    (await request(app).get("/api/cart").set("Authorization", auth(customer)))
      .body.length,
    0,
  );
});
test("COD uses latest server prices, saves history, clears cart and retries safely", async () => {
  await add(customer).expect(200);
  await Product.updateOne({ _id: product.id }, { pricePaise: 150000 });
  const id = randomUUID();
  const order = (await buy(customer, id).expect(201)).body;
  assert.equal(order.totalPaise, 150000);
  assert.equal(order.paymentStatus, "pending");
  assert.equal((await Product.findById(product.id)).quantity, 2);
  const retried = (await buy(customer, id).expect(201)).body;
  assert.equal(retried._id, order._id);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(product.id)).quantity, 2);
  assert.equal(
    (await request(app).get("/api/cart").set("Authorization", auth(customer)))
      .body.length,
    0,
  );
  await request(app)
    .get(`/api/orders/${order._id}`)
    .set("Authorization", auth(second))
    .expect(404);
  assert.equal(
    (await request(app).get("/api/orders").set("Authorization", auth(second)))
      .body.length,
    0,
  );
});
test("failed checkout rolls back earlier stock changes and preserves the cart", async () => {
  const unavailable = await Product.create({
    ...productBody,
    name: "Second item",
  });
  await add(customer).expect(200);
  await add(customer, unavailable.id).expect(200);
  await Product.updateOne({ _id: unavailable.id }, { quantity: 0 });
  await buy(customer).expect(409);
  assert.equal((await Product.findById(product.id)).quantity, 3);
  assert.equal(await Order.countDocuments(), 0);
  const user = await User.findOne({ email: "customer@test.local" });
  assert.equal(user.cart.length, 2);
});
test("two customers competing for the final unit cannot oversell", async () => {
  await Product.updateOne({ _id: product.id }, { quantity: 1 });
  await add(customer).expect(200);
  await add(second).expect(200);
  const results = await Promise.all([buy(customer), buy(second)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await Product.findById(product.id)).quantity, 0);
  assert.equal(await Order.countDocuments(), 1);
});
test("simultaneous duplicate checkout creates only one order", async () => {
  await add(customer).expect(200);
  const id = randomUUID();
  const results = await Promise.all([buy(customer, id), buy(customer, id)]);
  assert.deepEqual(
    results.map((r) => r.status),
    [201, 201],
  );
  assert.equal(results[0].body._id, results[1].body._id);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(product.id)).quantity, 2);
});
test("mock decline does not change data; mock success records simulated payment", async () => {
  await add(customer).expect(200);
  const body = { requestId: randomUUID(), shipping, outcome: "failure" };
  await request(app)
    .post("/api/payments/mock/checkout")
    .set("Authorization", auth(customer))
    .send(body)
    .expect(402);
  assert.equal(await Order.countDocuments(), 0);
  assert.equal((await Product.findById(product.id)).quantity, 3);
  const success = await request(app)
    .post("/api/payments/mock/checkout")
    .set("Authorization", auth(customer))
    .send({ ...body, outcome: "success" })
    .expect(201);
  assert.equal(success.body.paymentStatus, "mock_paid");
  process.env.NODE_ENV = "production";
  await request(app)
    .post("/api/payments/mock/checkout")
    .set("Authorization", auth(customer))
    .send({ ...body, requestId: randomUUID() })
    .expect(403);
  process.env.NODE_ENV = "test";
});
test("admin statuses advance in order and customers cannot change them", async () => {
  await add(customer).expect(200);
  const order = (await buy(customer).expect(201)).body;
  const path = `/api/admin/orders/${order._id}/status`;
  await request(app)
    .patch(path)
    .set("Authorization", auth(customer))
    .send({ status: "preparing" })
    .expect(403);
  await request(app)
    .patch(path)
    .set("Authorization", auth(admin))
    .send({ status: "delivered" })
    .expect(409);
  for (const status of ["preparing", "out_for_delivery", "delivered"])
    await request(app)
      .patch(path)
      .set("Authorization", auth(admin))
      .send({ status })
      .expect(200);
  const saved = await Order.findById(order._id);
  assert.equal(saved.paymentStatus, "collected");
  await request(app)
    .patch(path)
    .set("Authorization", auth(admin))
    .send({ status: "preparing" })
    .expect(409);
});
test("malformed IDs, client totals and empty checkouts are rejected", async () => {
  await request(app).get("/api/products/not-an-id").expect(400);
  await buy(customer).expect(400);
  await add(customer).expect(200);
  await request(app)
    .post("/api/orders/checkout")
    .set("Authorization", auth(customer))
    .send({ requestId: randomUUID(), shipping, totalPaise: 1 })
    .expect(400);
});
