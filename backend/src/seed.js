import "./config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { checkEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
// Seed only an empty catalogue; rerunning does not reset stock or existing accounts.
try {
  checkEnvironment();
  if (
    !process.env.ADMIN_EMAIL ||
    !process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD.length < 8 ||
    process.env.ADMIN_PASSWORD.length > 72 ||
    process.env.ADMIN_PASSWORD.startsWith("replace_")
  )
    throw new Error(
      "Choose ADMIN_EMAIL and your own ADMIN_PASSWORD (8–72 characters) in .env.",
    );
  await connectDatabase(process.env.MONGODB_URI);
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing && existing.role !== "admin")
    throw new Error(
      "That email belongs to a customer. Choose a different ADMIN_EMAIL.",
    );
  if (!existing)
    await User.create({
      name: process.env.ADMIN_NAME || "GAZU Admin",
      email,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      role: "admin",
    });
  if ((await Product.countDocuments()) === 0)
    await Product.insertMany([
      {
        name: "Relaxed Cotton Tee",
        category: "Men",
        type: "T-Shirts",
        pricePaise: 129900,
        quantity: 12,
        color: "Stone",
        tag: "BESTSELLER",
        img: "photo-1521572163474-6864f9cf17ab",
        description: "A relaxed everyday cotton tee.",
      },
      {
        name: "Soft Knit Pullover",
        category: "Women",
        type: "Knitwear",
        pricePaise: 249900,
        quantity: 8,
        color: "Oat",
        tag: "NEW",
        img: "photo-1434389677669-e08b4cac3105",
        description: "A soft layer for cool evenings.",
      },
      {
        name: "Structured Tote",
        category: "Accessories",
        type: "Accessories",
        pricePaise: 99900,
        quantity: 5,
        color: "Black",
        img: "photo-1548036328-c9fa89d128fa",
        description: "A practical bag for daily essentials.",
      },
    ]);
  console.log(
    "Seed complete. Sign in with the admin email and password you chose in .env.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
