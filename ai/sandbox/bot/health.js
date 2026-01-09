import http from "http";
import { log } from "./utils/logger.js";

export function startHealthServer(port = 3000) {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "gcz-bot" }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    log("health", `Health server running on port ${port}`);
  });

  server.on("error", (err) => {
    log("health", "Health server error", err);
  });
}