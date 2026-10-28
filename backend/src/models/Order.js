import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: String, required: true },
    items: [
      {
        product: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        unitPricePaise: Number,
      },
    ],
    shipping: {
      name: String,
      address: String,
      city: String,
      pin: String,
      phone: String,
    },
    subtotalPaise: Number,
    deliveryPaise: Number,
    totalPaise: Number,
    paymentMethod: { type: String, enum: ["cod", "mock"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "mock_paid", "collected"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["placed", "preparing", "out_for_delivery", "delivered"],
      default: "placed",
    },
  },
  { timestamps: true },
);
schema.index({ user: 1, requestId: 1 }, { unique: true });
export default mongoose.model("Order", schema);
