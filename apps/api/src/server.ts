import express from "express";
import cors from "cors";
import helmet from "helmet";
import aiRoutes from "./routes/ai.routes.js";
import appsRoutes from "./routes/apps.routes.js";
import ideasRoutes from "./routes/ideas.routes.js";
import marketRoutes from "./routes/market.routes.js";
import opportunitiesRoutes from "./routes/opportunities.routes.js";
import cloneListRoutes from "./routes/clone-list.routes.js";

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

app.use("/api/apps", aiRoutes);
app.use("/api/apps", appsRoutes);
app.use("/api/ideas", ideasRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/clone-list", cloneListRoutes);

export default app;