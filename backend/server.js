import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import dotenv       from "dotenv";
import authRoutes    from "./src/routes/auth.routes.js";
import deviceRoutes  from "./src/routes/device.routes.js";
import fabricRoutes from "./src/routes/fabric.routes.js";
import batchRoutes from "./src/routes/batch.routes.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin:     [ process.env.CLIENT_URL, 
    "http://localhost:5173", 
    "http://167.172.76.154", 
    "http://localhost:5173",      // keep for local dev
    "http://localhost:5000"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",    authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/fabric", fabricRoutes);
app.use("/api/batches", batchRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}); 

