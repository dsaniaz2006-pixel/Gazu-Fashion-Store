import React, { useRef, useState } from "react";
import { api } from "../api.js";
const money = (n) =>
  (n / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
// Submit delivery details only: the server loads the cart and calculates all prices.
export default function Checkout({ cart, user, mockEnabled, onComplete, go }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("cod");
  const [order, setOrder] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  const subtotal = cart.reduce((sum, p) => sum + p.pricePaise * p.qty, 0);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const shipping = Object.fromEntries(new FormData(event.currentTarget));
    const body = { requestId: requestId.current, shipping };
    if (method !== "cod")
      body.outcome = method === "mock" ? "success" : "failure";
    try {
      const saved = await api(
        method === "cod" ? "/orders/checkout" : "/payments/mock/checkout",
        { method: "POST", body },
      );
      setOrder(saved);
      onComplete();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <div className="empty">
        <h1>SIGN IN TO CHECK OUT</h1>
        <button className="btn dark" onClick={() => go("account")}>
          SIGN IN
        </button>
      </div>
    );
  if (order)
    return (
      <div className="empty">
        <p className="eyebrow">THANK YOU, {user.name}</p>
        <h1>ORDER PLACED</h1>
        <p className="order-id">Order ID: {order._id}</p>
        <p>
          Total: {money(order.totalPaise)} ·{" "}
          {order.paymentMethod === "cod"
            ? "Pay on delivery"
            : "Mock payment — no money charged"}
        </p>
        <button className="btn dark" onClick={() => go("track")}>
          VIEW MY ORDERS
        </button>
      </div>
    );
  if (!cart.length)
    return (
      <div className="empty">
        <h1>YOUR BAG IS EMPTY</h1>
        <button className="btn dark" onClick={() => go("shop", "All")}>
          BROWSE PRODUCTS
        </button>
      </div>
    );
  return (
    <div className="page-wrap">
      <div className="page-title">
        <p className="eyebrow">ALMOST YOURS</p>
        <h1>CHECKOUT</h1>
      </div>
      <div className="cart-layout checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>DELIVERY DETAILS</h2>
          <label>
            Full name
            <input
              name="name"
              defaultValue={user.name}
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            Address
            <input
              name="address"
              autoComplete="street-address"
              minLength={5}
              maxLength={300}
              required
            />
          </label>
          <div className="form-row">
            <label>
              City
              <input
                name="city"
                autoComplete="address-level2"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              PIN code
              <input
                name="pin"
                autoComplete="postal-code"
                inputMode="numeric"
                pattern="[1-9][0-9]{5}"
                required
              />
            </label>
          </div>
          <label>
            Phone
            <input
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9]{10}"
              required
            />
          </label>
          <label>
            Payment method
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={busy}
            >
              <option value="cod">Cash on delivery</option>
              {mockEnabled && (
                <>
                  <option value="mock">Mock payment — simulate success</option>
                  <option value="failure">
                    Mock payment — simulate failure
                  </option>
                </>
              )}
            </select>
          </label>
          <p className="form-note">
            Mock payments are free local simulations. No card, UPI, API key, or
            real payment is needed.
          </p>
          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}
          <button disabled={busy} className="btn dark full">
            {busy ? "PLACING ORDER…" : "PLACE ORDER"}
          </button>
        </form>
        <aside className="order-summary">
          <h2>YOUR ORDER</h2>
          {cart.map((p) => (
            <div key={p.id}>
              <span>
                {p.name} × {p.qty}
              </span>
              <b>{money(p.pricePaise * p.qty)}</b>
            </div>
          ))}
          <div>
            <span>Delivery</span>
            <b>{money(subtotal >= 99900 ? 0 : 9900)}</b>
          </div>
          <div className="summary-total">
            <span>ESTIMATED TOTAL</span>
            <b>{money(subtotal + (subtotal >= 99900 ? 0 : 9900))}</b>
          </div>
          <p>
            Final prices and availability are checked by the server when you
            place the order.
          </p>
        </aside>
      </div>
    </div>
  );
}
