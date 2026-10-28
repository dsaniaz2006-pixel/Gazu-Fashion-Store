import "./config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

try {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 8 || password.length > 72) {
    throw new Error("Set a valid ADMIN_PASSWORD in .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await User.findOne({ email, role: "admin" });

  if (!admin) {
    throw new Error("Admin account not found.");
  }

  admin.passwordHash = await bcrypt.hash(password, 12);
  await admin.save();

  console.log("Admin password updated successfully!");
} catch (error) {
  console.error(error.message);
} finally {
  await mongoose.disconnect();
}