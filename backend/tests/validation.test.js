import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutSchema, productSchema, quantity } from '../src/middleware/validate.js';
import { randomUUID } from 'node:crypto';
const product = { name: 'Cotton Tee', category: 'Men', type: 'T-Shirts', img: 'photo-1521572163474-6864f9cf17ab', pricePaise: 129900, quantity: 3, inStock: true };
const checkout = { requestId: randomUUID(), shipping: { name: 'Demo Customer', address: '12 Test Road', city: 'Chandigarh', pin: '160001', phone: '9876543210' } };
// Fast tests for API boundaries; no database or network is required.
test('quantity accepts only integers from 1 through 99', () => {
  for (const bad of [0, -1, 1.5, '2', 100]) assert.equal(quantity.safeParse(bad).success, false);
  assert.equal(quantity.parse(2), 2);
});
test('product accepts zero stock but rejects negative stock and fractional paise', () => {
  assert.equal(productSchema.parse({ ...product, quantity: 0 }).quantity, 0);
  assert.equal(productSchema.safeParse({ ...product, quantity: -1 }).success, false);
  assert.equal(productSchema.safeParse({ ...product, pricePaise: 12.5 }).success, false);
});
test('product rejects unapproved fields and non-photo image input', () => {
  assert.equal(productSchema.safeParse({ ...product, active: true }).success, false);
  assert.equal(productSchema.safeParse({ ...product, img: 'javascript:alert(1)' }).success, false);
});
test('checkout accepts delivery details but rejects client prices and user IDs', () => {
  assert.equal(checkoutSchema.safeParse(checkout).success, true);
  assert.equal(checkoutSchema.safeParse({ ...checkout, totalPaise: 1 }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...checkout, user: 'other-user' }).success, false);
});
test('checkout requires valid phone, PIN and retry reference', () => {
  assert.equal(checkoutSchema.safeParse({ ...checkout, requestId: 'x' }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...checkout, shipping: { ...checkout.shipping, pin: '000000' } }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...checkout, shipping: { ...checkout.shipping, phone: '123' } }).success, false);
});

import request from 'supertest';
import app from '../src/app.js';
// Exercise real Express middleware without depending on MongoDB startup.
test('health returns JSON', async () => { await request(app).get('/api/health').expect(200); });
test('cart rejects unauthenticated requests', async () => { await request(app).get('/api/cart').expect(401); });
test('admin rejects unauthenticated requests', async () => { await request(app).get('/api/admin/products').expect(401); });
test('registration rejects role injection before touching the database', async () => {
  await request(app).post('/api/auth/register').send({ name: 'Demo', email: 'demo@example.com', password: 'Password123', role: 'admin' }).expect(400);
});
test('product route rejects malformed IDs', async () => { await request(app).get('/api/products/not-valid').expect(400); });
test('unknown API paths return JSON 404', async () => { await request(app).get('/api/missing').expect(404); });
