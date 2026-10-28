import "./config/env.js";
import { checkEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import app from "./app.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
// Connect first: a backend without its database must not advertise readiness.
try {
  checkEnvironment();
  await connectDatabase(process.env.MONGODB_URI);
  // Build unique email and checkout indexes before accepting writes.
  await Promise.all([User.init(), Product.init(), Order.init()]);
  app.listen(Number(process.env.PORT) || 8000, () =>
    console.log(
      `GAZU API ready at http://localhost:${process.env.PORT || 8000}`,
    ),
  );
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}
