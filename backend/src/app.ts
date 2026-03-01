import express from "express";
import cors from "cors";
import ordersRoutes from "./routes/orders.routes";
import { initDb } from "./config/db";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/orders", ordersRoutes);

const PORT = 3000;

const start = async () => {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
