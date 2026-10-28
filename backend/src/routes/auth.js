import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { fail } from "../utils/errors.js";
const router = Router();
const credentials = z
  .object({
    email: z.email().trim().toLowerCase().max(254),
    password: z.string().min(8).max(72),
  })
  .strict();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Try again in 15 minutes." },
});
// Return only public account fields; the token expires after eight hours.
function session(user) {
  return {
    token: jwt.sign({}, process.env.JWT_SECRET, {
      subject: String(user._id),
      expiresIn: "8h",
      algorithm: "HS256",
    }),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
// Registration always creates a customer; public users cannot assign themselves admin.
router.post(
  "/register",
  limiter,
  validate(credentials.extend({ name: z.string().trim().min(2).max(80) })),
  async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.exists({ email }))
      fail(409, "This email is already registered.");
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "customer",
    });
    res.status(201).json(session(user));
  },
);
// Compare the supplied password with its hash, never a stored plaintext password.
router.post("/login", limiter, validate(credentials), async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+passwordHash",
  );
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    fail(401, "Incorrect email or password.");
  res.json(session(user));
});
router.get("/me", requireAuth, (req, res) =>
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  }),
);
export default router;
