import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate, checkoutSchema } from "../middleware/validate.js";
import { checkout } from "../services/checkout.js";
import { fail } from "../utils/errors.js";
const router = Router();
// This educational API does not contact a payment provider or move real money.
router.get("/config", (req, res) =>
  res.json({
    mockEnabled:
      process.env.ENABLE_MOCK_PAYMENTS === "true" &&
      process.env.NODE_ENV !== "production",
  }),
);
router.post(
  "/mock/checkout",
  requireAuth,
  validate(checkoutSchema.extend({ outcome: z.enum(["success", "failure"]) })),
  async (req, res) => {
    if (
      process.env.ENABLE_MOCK_PAYMENTS !== "true" ||
      process.env.NODE_ENV === "production"
    )
      fail(403, "Mock payments are disabled. Use COD.");
    if (req.body.outcome === "failure")
      fail(
        402,
        "Mock payment declined. No order was created. Your bag is unchanged.",
      );
    res.status(201).json(await checkout(req.user.id, req.body, "mock"));
  },
);
export default router;
