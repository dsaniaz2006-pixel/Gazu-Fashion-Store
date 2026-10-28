import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { fail } from "../utils/errors.js";
// Return current product details, flagging deleted/unavailable items for removal.
export async function readCart(userId) {
  const user = await User.findById(userId).populate("cart.product");
  return user.cart.map((item) => ({
    productId: String(item.product?._id || ""),
    quantity: item.quantity,
    product: item.product,
  }));
}
// A transaction retries conflicting writes so cart updates cannot race checkout.
export async function changeCart(userId, productId, quantity, mode) {
  await mongoose.connection.transaction(async (session) => {
    const user = await User.findById(userId).session(session);
    const existing = user.cart.find(
      (item) => String(item.product) === productId,
    );
    if (mode === "remove") {
      user.cart = user.cart.filter(
        (item) => String(item.product) !== productId,
      );
    } else {
      const product = await Product.findById(productId).session(session);
      const nextQuantity =
        mode === "add" ? (existing?.quantity || 0) + quantity : quantity;
      if (
        !product?.active ||
        !product.inStock ||
        nextQuantity > product.quantity
      )
        fail(409, "This quantity is not available.");
      if (nextQuantity > 99) fail(400, "Maximum 99 units per product.");
      if (mode === "set" && !existing) fail(404, "Cart item not found.");
      if (existing) existing.quantity = nextQuantity;
      else user.cart.push({ product: productId, quantity: nextQuantity });
    }
    await user.save({ session });
  });
  return readCart(userId);
}
