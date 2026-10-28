// Keep the token for this tab only. Logout clears it; expiry requires a new login.
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("gazu-token");
  let response;
  try {
    response = await fetch("/api" + path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new Error("Cannot reach the backend. Start it on port 8000.");
  }
  if (response.status === 204) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Backend unavailable. Check the backend terminal and port 8000.",
    );
  }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("gazu-session-expired"));
    throw new Error(data.message || "Request failed.");
  }
  return data;
}
// Adapt database names to the original GAZU card layout.
export function toProduct(p) {
  return {
    ...p,
    id: p._id,
    price: p.pricePaise / 100,
    available: p.active && p.inStock && p.quantity > 0,
  };
}
export function toCart(lines) {
  return lines
    .filter((line) => line.product)
    .map((line) => ({ ...toProduct(line.product), qty: line.quantity }));
}
