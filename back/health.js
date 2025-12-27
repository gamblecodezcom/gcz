app.get("/api/health", (_, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

