import { Router } from "express";
import { z } from "zod";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate, validateId, productSchema } from "../middleware/validate.js";
import { fail } from "../utils/errors.js";
const router = Router();
router.use(requireAuth, requireAdmin);
// Only administrators may create, edit, list or soft-delete inventory.
router.get("/products", async (req, res) =>
  res.json(await Product.find({ active: true }).sort({ createdAt: 1 })),
);
router.post("/products", validate(productSchema), async (req, res) =>
  res.status(201).json(await Product.create(req.body)),
);
router.patch(
  "/products/:id",
  validateId,
  validate(productSchema),
  async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, active: true },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!product) fail(404, "Product not found.");
    res.json(product);
  },
);
router.delete("/products/:id", validateId, async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, active: true },
    { $set: { active: false } },
  );
  if (!product) fail(404, "Product not found.");
  res.status(204).end();
});
router.get("/orders", async (req, res) =>
  res.json(
    await Order.find().populate("user", "name email").sort({ createdAt: -1 }),
  ),
);
// A conditional update prevents skipping states or racing two status changes.
router.patch(
  "/orders/:id/status",
  validateId,
  validate(
    z
      .object({
        status: z.enum(["preparing", "out_for_delivery", "delivered"]),
      })
      .strict(),
  ),
  async (req, res) => {
    const previous = {
      preparing: "placed",
      out_for_delivery: "preparing",
      delivered: "out_for_delivery",
    }[req.body.status];
    const changes = { status: req.body.status };
    // Status and COD collection commit in the same atomic document update.
    if (req.body.status === "delivered")
      changes.paymentStatus = {
        $cond: [
          { $eq: ["$paymentMethod", "cod"] },
          "collected",
          "$paymentStatus",
        ],
      };
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: previous },
      [{ $set: changes }],
      { new: true },
    );
    if (!order)
      fail(
        409,
        "Order is missing or the status change is not allowed. Refresh the list.",
      );
    res.json(order);
  },
);
export default router;
