import React, { useEffect, useState } from "react";
import { api } from "../api.js";
export const statuses = {
  placed: "Placed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};
const next = {
  placed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};
const money = (n) =>
  (n / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
// Customers see their own orders; the admin variant includes customer and shipping details.
export default function Orders({ user, admin = false, go }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setOrders(await api(admin ? "/admin/orders" : "/orders"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user?.id, admin]);
  async function change(order) {
    setBusy(true);
    setError("");
    try {
      await api(`/admin/orders/${order._id}/status`, {
        method: "PATCH",
        body: { status: next[order.status] },
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <div className="empty">
        <h1>SIGN IN TO VIEW ORDERS</h1>
        <button className="btn dark" onClick={() => go("account")}>
          SIGN IN
        </button>
      </div>
    );
  return (
    <section className={admin ? "" : "page-wrap"}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {admin ? "FULFILMENT" : "YOUR GAZU JOURNEY"}
          </p>
          <h1>{admin ? "ALL ORDERS" : "MY ORDERS"}</h1>
        </div>
        <button className="btn" disabled={loading || busy} onClick={load}>
          REFRESH
        </button>
      </div>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading orders…</p>
      ) : !orders.length && !error ? (
        <p>No orders yet.</p>
      ) : null}
      {orders.map((order) => (
        <article key={order._id} className="order-card">
          <div className="order-head">
            <div>
              <p className="order-id">{order._id}</p>
              <small>
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </small>
            </div>
            <span className="stock-badge">{statuses[order.status]}</span>
          </div>
          {admin && (
            <p>
              <b>{order.user?.name || "Customer"}</b> · {order.user?.email}
            </p>
          )}
          <ul>
            {order.items.map((item) => (
              <li key={item._id}>
                {item.name} × {item.quantity} —{" "}
                {money(item.unitPricePaise * item.quantity)}
              </li>
            ))}
          </ul>
          <p>
            <b>Total {money(order.totalPaise)}</b> · Delivery{" "}
            {money(order.deliveryPaise)}
          </p>
          <p>
            {order.paymentMethod === "cod"
              ? `Cash on delivery · ${order.paymentStatus}`
              : "Mock paid — no real money charged"}
          </p>
          <p>
            Deliver to: {order.shipping.name}, {order.shipping.address},{" "}
            {order.shipping.city} — {order.shipping.pin}. Phone:{" "}
            {order.shipping.phone}
          </p>
          {admin && next[order.status] && (
            <button
              className="btn dark"
              disabled={busy}
              onClick={() => change(order)}
            >
              MARK {statuses[next[order.status]].toUpperCase()}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
