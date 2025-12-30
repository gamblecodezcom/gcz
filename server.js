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

// Security headers
import { securityHeaders } from "./middleware/security.js";
app.use(securityHeaders);

// Rate limiting
import { rateLimit, strictRateLimit, authRateLimit } from "./middleware/rateLimit.js";
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // General rate limit

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan("combined"));

// Make io available to routes
app.set("io", io);

// API Routes
import dailySpinRouter from "./routes/dailySpin.js";
import rafflesRouter from "./routes/raffles.js";
import rafflesExtendedRouter from "./routes/rafflesExtended.js";
import statsRouter from "./routes/stats.js";
import affiliatesRouter from "./routes/affiliates.js";
import newsletterRouter from "./routes/newsletter.js";
import promosRouter from "./routes/promos.js";
import adminRouter from "./routes/admin.js";
import profileRouter from "./routes/profile.js";
import dashboardRouter from "./routes/dashboard.js";
import activityRouter from "./routes/activity.js";
import notificationsRouter from "./routes/notifications.js";
import pushRouter from "./routes/push.js";
import adsRouter from "./routes/ads.js";
import sitesRouter from "./routes/sites.js";
import contactRouter from "./routes/contact.js";
import blacklistRouter from "./routes/blacklist.js";
import liveDashboardRouter from "./routes/liveDashboard.js";
import giveawaysRouter from "./routes/giveaways.js";
import gamificationRouter from "./routes/gamification.js";
import realtimeRouter from "./routes/realtime.js";
import analyticsRouter from "./routes/analytics.js";
import dropsRouter from "./routes/drops.js";
import socialsRouter from "./routes/socials.js";
import casinoRouter from "./routes/casino.js";

app.use("/api/daily-spin", dailySpinRouter);
app.use("/api/raffles", rafflesRouter);
app.use("/api/raffles", rafflesExtendedRouter); // Extended raffle routes
app.use("/api/stats", statsRouter);
app.use("/api/affiliates", affiliatesRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/promos", promosRouter);
app.use("/api/admin", adminRouter);
// Apply auth rate limiting to sensitive endpoints
app.use("/api/profile/pin", authRateLimit());
app.use("/api/profile/verify-pin", authRateLimit());
app.use("/api/profile/change-pin", authRateLimit());

app.use("/api/profile", profileRouter);
app.use("/api/profile", dashboardRouter); // Dashboard stats and site linking
app.use("/api/profile", activityRouter); // Activity log and wheel history
app.use("/api/notifications", notificationsRouter);
app.use("/api/profile", notificationsRouter); // Notification settings under /api/profile/notifications
app.use("/api/push", pushRouter);
app.use("/api/ads", adsRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/contact", contactRouter);
app.use("/api/blacklist", blacklistRouter);
app.use("/api/live-dashboard", liveDashboardRouter);
app.use("/api/giveaways", giveawaysRouter);
app.use("/api/gamification", gamificationRouter);
app.use("/api/realtime", realtimeRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/drops", dropsRouter);
app.use("/api/socials", socialsRouter);
app.use("/api/casino", casinoRouter);

// Apply strict rate limiting to admin endpoints
app.use("/api/admin", strictRateLimit());

// WebSocket connection for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // User authentication
  socket.on("user:authenticate", (userId) => {
    socket.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated on socket ${socket.id}`);
  });

  // Admin subscription
  socket.on("admin:subscribe", (room) => {
    socket.join(room);
    socket.join("admin");
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  // Subscribe to real-time events
  socket.on("realtime:subscribe", (eventTypes) => {
    if (Array.isArray(eventTypes)) {
      eventTypes.forEach(type => {
        socket.join(`event:${type}`);
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("io", io);

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

// Helper function to detect if request is from a bot/crawler
function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'sogou', 'exabot', 'facebot', 'ia_archiver',
    'crawler', 'spider', 'bot', 'crawling', 'scraper', 'fetcher'
  ];
  return botPatterns.some(pattern => ua.includes(pattern));
}

// Static frontend build
const distPath = path.join(__dirname, "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Catch-all route for SPA - must be last
  // Express 5 requires different syntax for catch-all routes
  app.use((req, res, next) => {
    // Skip if it's an API route or static asset that was already handled
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    // Smart 404 redirect: bots get 301 redirect to homepage, humans see 404 page
    const userAgent = req.get('user-agent') || '';
    if (isBot(userAgent)) {
      // Log bot redirect for monitoring
      console.log(`[Bot Redirect] ${userAgent.substring(0, 100)} - ${req.method} ${req.path} -> 301 /`);
      return res.redirect(301, '/');
    }
    
    // Only handle if it's not a static file request
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
