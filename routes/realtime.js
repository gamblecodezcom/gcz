import express from "express";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * GET /api/realtime/events
 * Server-Sent Events endpoint for real-time updates
 * 
 * @route GET /api/realtime/events
 */
router.get("/events", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || req.headers["x-user-id"] || "guest";

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

    // Get io instance from app
    const io = req.app.get('io');
    if (!io) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'WebSocket server not available' })}\n\n`);
      res.end();
      return;
    }

    // Join user-specific room
    const socket = io.sockets.sockets.get(userId);
    if (socket) {
      socket.join(`user:${userId}`);
    }

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      res.end();
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    res.status(500).json({ error: "Failed to establish SSE connection" });
  }
});

/**
 * Broadcast real-time event to user
 * @param {Object} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 */
export function broadcastToUser(io, userId, eventType, data) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('realtime:event', {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast to all admin clients
 * @param {Object} io - Socket.IO instance
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 */
export function broadcastToAdmins(io, eventType, data) {
  if (!io) return;
  
  io.to('admin').emit('admin:update', {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  });
}

export default router;
