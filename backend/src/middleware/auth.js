import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { fail } from "../utils/errors.js";
// Verify the token, then load the current database role for every protected request.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    fail(401, "Please sign in again.");
  }
  const user = await User.findById(payload.sub);
  if (!user) fail(401, "Account no longer exists.");
  req.user = user;
  next();
}
// Frontend visibility is not security: this check protects all admin API endpoints.
export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") fail(403, "Administrator access required.");
  next();
}
