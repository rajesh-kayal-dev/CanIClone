import express from "express";
import cors from "cors";
import helmet from "helmet";
import appsRoutes from "./routes/apps.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "CanIClone API is running",
  });
});

app.use("/api/apps", appsRoutes);

export default app;