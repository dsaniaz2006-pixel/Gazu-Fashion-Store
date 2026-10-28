import { Router } from "express";
import Order from "../models/Order.js";
import { requireAuth } from "../middleware/auth.js";
import {
  validate,
  validateId,
  checkoutSchema,
} from "../middleware/validate.js";
import { checkout } from "../services/checkout.js";
import { fail } from "../utils/errors.js";
const router = Router();
router.use(requireAuth);
// List only this customer's history, preserving purchase-time names and prices.
router.get("/", async (req, res) =>
  res.json(await Order.find({ user: req.user.id }).sort({ createdAt: -1 })),
);
router.post("/checkout", validate(checkoutSchema), async (req, res) =>
  res.status(201).json(await checkout(req.user.id, req.body, "cod")),
);
router.get("/:id", validateId, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) fail(404, "Order not found.");
  res.json(order);
});
export default router;
