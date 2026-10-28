import { Router } from "express";
import Product from "../models/Product.js";
import { validateId } from "../middleware/validate.js";
import { fail } from "../utils/errors.js";
const router = Router();
// Public catalogue: only active products, with availability derived from both controls.
router.get("/", async (req, res) =>
  res.json(await Product.find({ active: true }).sort({ createdAt: 1 }).lean()),
);
router.get("/:id", validateId, async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, active: true });
  if (!product) fail(404, "Product not found.");
  res.json(product);
});
export default router;
