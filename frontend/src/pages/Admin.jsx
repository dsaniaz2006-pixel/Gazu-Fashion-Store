import React, { useState } from "react";
import { api } from "../api.js";
import Orders from "./Orders.jsx";
const blank = {
  name: "",
  description: "",
  category: "Men",
  type: "T-Shirts",
  color: "",
  tag: "",
  img: "photo-1521572163474-6864f9cf17ab",
  price: "",
  quantity: 0,
  inStock: true,
};
// Simple product editor; all form fields are explicitly mapped to allowed API fields.
export default function Admin({ user, products, reload, go }) {
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((old) => ({
      ...old,
      [name]: type === "checkbox" ? checked : value,
    }));
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const { price, ...fields } = form;
    try {
      await api(editing ? `/admin/products/${editing}` : "/admin/products", {
        method: editing ? "PATCH" : "POST",
        body: {
          ...fields,
          pricePaise: Math.round(Number(price) * 100),
          quantity: Number(fields.quantity),
        },
      });
      setForm(blank);
      setEditing(null);
      setMessage("Product saved.");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function edit(product) {
    setEditing(product.id);
    setError("");
    setMessage("");
    setForm(
      Object.fromEntries(
        Object.keys(blank).map((key) => [key, product[key] ?? blank[key]]),
      ),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(product) {
    if (
      !window.confirm(
        `Delete ${product.name} from the catalogue? Existing orders will be kept.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(`/admin/products/${product.id}`, { method: "DELETE" });
      if (editing === product.id) {
        setEditing(null);
        setForm(blank);
      }
      await reload();
      setMessage("Product deleted from the catalogue.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (user?.role !== "admin")
    return (
      <div className="empty">
        <h1>ADMIN ACCESS REQUIRED</h1>
        <button className="btn dark" onClick={() => go("account")}>
          ACCOUNT
        </button>
      </div>
    );
  return (
    <div className="page-wrap">
      <p className="eyebrow">GAZU / ADMIN</p>
      <h1>MANAGE THE STORE</h1>
      <p>
        {products.length} products ·{" "}
        {products.filter((p) => p.available).length} in stock
      </p>
      <div className="admin-layout">
        <form className="checkout-form admin-form" onSubmit={save}>
          <h2>{editing ? "EDIT PRODUCT" : "ADD PRODUCT"}</h2>
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={change}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={change}
              maxLength={1000}
            />
          </label>
          <div className="form-row">
            <label>
              Price (₹)
              <input
                name="price"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                value={form.price}
                onChange={change}
                required
              />
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="0"
                max="100000"
                step="1"
                value={form.quantity}
                onChange={change}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Category
              <select name="category" value={form.category} onChange={change}>
                {["Men", "Women", "Kids", "Accessories"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Type
              <input
                name="type"
                value={form.type}
                onChange={change}
                required
                maxLength={50}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Colour
              <input
                name="color"
                value={form.color}
                onChange={change}
                maxLength={50}
              />
            </label>
            <label>
              Tag
              <input
                name="tag"
                value={form.tag}
                onChange={change}
                maxLength={30}
              />
            </label>
          </div>
          <label>
            Unsplash photo ID
            <input
              name="img"
              value={form.img}
              onChange={change}
              required
              pattern="photo-[a-zA-Z0-9-]+"
            />
          </label>
          <small>
            Keep the default image or enter a photo ID such as
            photo-1521572163474-6864f9cf17ab. Image uploads are outside this
            version.
          </small>
          <label className="check-label">
            <input
              name="inStock"
              type="checkbox"
              checked={form.inStock}
              onChange={change}
            />{" "}
            Mark available for sale
          </label>
          <small>
            Zero quantity always displays OUT OF STOCK. Uncheck to stop selling
            even if quantity remains.
          </small>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <div className="action-row">
            <button disabled={busy} className="btn dark">
              {busy ? "SAVING…" : editing ? "SAVE CHANGES" : "ADD PRODUCT"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => {
                  setEditing(null);
                  setForm(blank);
                }}
              >
                CANCEL EDIT
              </button>
            )}
          </div>
        </form>
        <div className="admin-products">
          {products.map((p) => (
            <article className="admin-product" key={p.id}>
              <img
                src={`https://images.unsplash.com/${p.img}?auto=format&fit=crop&w=160&q=70`}
                alt={p.name}
              />
              <div>
                <h3>{p.name}</h3>
                <p>
                  ₹{p.price.toLocaleString("en-IN")} · Qty {p.quantity}
                </p>
                <p>{p.available ? "IN STOCK" : "OUT OF STOCK"}</p>
                <div className="action-row">
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => edit(p)}
                  >
                    EDIT
                  </button>
                  <button
                    className="text-link danger"
                    disabled={busy}
                    onClick={() => remove(p)}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <Orders user={user} admin go={go} />
    </div>
  );
}
