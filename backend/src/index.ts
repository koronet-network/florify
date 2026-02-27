import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { vendorRouter } from "./routes/vendor";
import { ordersRouter } from "./routes/orders";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/orders", ordersRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
