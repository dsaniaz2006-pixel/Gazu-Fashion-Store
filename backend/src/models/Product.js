import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    type: { type: String, default: "T-Shirts" },
    color: { type: String, default: "" },
    tag: { type: String, default: "" },
    img: { type: String, default: "photo-1521572163474-6864f9cf17ab" },
    // Money is stored as integer paise, never floating-point rupees.
    pricePaise: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    inStock: { type: Boolean, default: true },
    // Soft deletion hides the product while keeping order references intact.
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export default mongoose.model("Product", schema);
