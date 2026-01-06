export const settings = {
  aiUrl: process.env.GCZ_AI_URL || "http://127.0.0.1:8010",
  dbUrl: process.env.GCZ_DB || "",
  env: process.env.NODE_ENV || "production",
  serviceName: "gcz-mcp"
};