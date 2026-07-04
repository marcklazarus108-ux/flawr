import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import aiRoutes from "./routes/ai.js";
import exportRoutes from "./routes/export.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "flawr-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/export", exportRoutes);

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "That endpoint doesn't exist." });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Flawr backend running on port ${port}`);
});
