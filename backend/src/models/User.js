import mongoose from "mongoose";
const cartItem = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, min: 1, max: 99, required: true },
  },
  { _id: false },
);
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    cart: { type: [cartItem], default: [] },
  },
  { timestamps: true },
);
export default mongoose.model("User", userSchema);
