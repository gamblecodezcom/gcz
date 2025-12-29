import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Make io available to routes
app.set("io", io);

// API Routes
import dailySpinRouter from "./routes/dailySpin.js";
import rafflesRouter from "./routes/raffles.js";
import statsRouter from "./routes/stats.js";
import affiliatesRouter from "./routes/affiliates.js";
import newsletterRouter from "./routes/newsletter.js";
import promosRouter from "./routes/promos.js";
import adminRouter from "./routes/admin.js";

app.use("/api/daily-spin", dailySpinRouter);
app.use("/api/raffles", rafflesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/affiliates", affiliatesRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/promos", promosRouter);
app.use("/api/admin", adminRouter);

// WebSocket connection for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("admin:subscribe", (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Helper function to broadcast admin updates
function broadcastAdminUpdate(room, event, data) {
  io.to(room).emit(event, data);
}

// Make it available globally for routes
app.set("broadcastAdminUpdate", broadcastAdminUpdate);

// Admin health endpoint
app.get("/api/health", (_, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

// Static frontend build
const distPath = path.join(__dirname, "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("Frontend build missing.");
    }
  });
}

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
