import React, { useState } from "react";
import { api } from "../api.js";
// One form supports customer registration and login for both customer/admin roles.
export default function Account({ user, onLogin, onLogout, go }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await onLogin(
        await api(register ? "/auth/register" : "/auth/login", {
          method: "POST",
          body: fields,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (user)
    return (
      <div className="page-wrap">
        <p className="eyebrow">YOUR ACCOUNT / {user.role}</p>
        <h1>HELLO, {user.name}</h1>
        <p>{user.email}</p>
        <div className="action-row">
          <button className="btn dark" onClick={() => go("track")}>
            MY ORDERS
          </button>
          {user.role === "admin" && (
            <button className="btn dark" onClick={() => go("admin")}>
              ADMIN DASHBOARD
            </button>
          )}
          <button className="btn" onClick={onLogout}>
            SIGN OUT
          </button>
        </div>
      </div>
    );
  return (
    <div className="account-page">
      <div className="account-box">
        <p className="eyebrow">WELCOME TO GAZU</p>
        <h1>{register ? "JOIN THE EDIT." : "YOUR SPACE."}</h1>
        <p>
          {register
            ? "Create your customer account."
            : "Sign in to shop or manage your store."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <label>
              Name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={72}
            />
          </label>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy} className="btn dark full">
            {busy ? "PLEASE WAIT…" : register ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
        </form>
        <p className="form-note">
          <button
            disabled={busy}
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Already registered? SIGN IN"
              : "New here? CREATE AN ACCOUNT"}
          </button>
        </p>
      </div>
    </div>
  );
}
