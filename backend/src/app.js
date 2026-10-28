import express from "express";
import cors from "cors";
import helmet from "helmet";
import auth from "./routes/auth.js";
import products from "./routes/products.js";
import cart from "./routes/cart.js";
import orders from "./routes/orders.js";
import admin from "./routes/admin.js";
import payments from "./routes/payments.js";
import { errorHandler } from "./middleware/errors.js";
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", auth);
app.use("/api/products", products);
app.use("/api/cart", cart);
app.use("/api/orders", orders);
app.use("/api/admin", admin);
app.use("/api/payments", payments);
app.use((req, res) =>
  res.status(404).json({ message: "API endpoint not found." }),
);
app.use(errorHandler);
export default app;
