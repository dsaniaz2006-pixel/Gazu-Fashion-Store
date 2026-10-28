import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { fail } from "../utils/errors.js";
// Stock, order creation and cart clearing either commit together or all roll back.
export async function checkout(userId, input, paymentMethod) {
  return mongoose.connection.transaction(async (session) => {
    const previous = await Order.findOne({
      user: userId,
      requestId: input.requestId,
    }).session(session);
    if (previous) return previous; // Safe retry after a lost network response.
    const user = await User.findById(userId).session(session);
    if (!user.cart.length) fail(400, "Your cart is empty.");
    const items = [];
    for (const line of user.cart) {
      const product = await Product.findOneAndUpdate(
        {
          _id: line.product,
          active: true,
          inStock: true,
          quantity: { $gte: line.quantity },
        },
        { $inc: { quantity: -line.quantity } },
        { session, new: true },
      );
      if (!product)
        fail(
          409,
          "An item is unavailable or has insufficient stock. Update your bag.",
        );
      items.push({
        product: product._id,
        name: product.name,
        quantity: line.quantity,
        unitPricePaise: product.pricePaise,
      });
    }
    const subtotalPaise = items.reduce(
      (sum, item) => sum + item.unitPricePaise * item.quantity,
      0,
    );
    const deliveryPaise = subtotalPaise >= 99900 ? 0 : 9900;
    const [order] = await Order.create(
      [
        {
          user: userId,
          requestId: input.requestId,
          items,
          shipping: input.shipping,
          subtotalPaise,
          deliveryPaise,
          totalPaise: subtotalPaise + deliveryPaise,
          paymentMethod,
          paymentStatus: paymentMethod === "mock" ? "mock_paid" : "pending",
        },
      ],
      { session },
    );
    user.cart = [];
    await user.save({ session });
    return order;
  });
}
