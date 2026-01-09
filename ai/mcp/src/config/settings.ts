export const settings = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  gczApiUrl: process.env.API_BASE_URL || "http://localhost:8000",
  dbUrl: process.env.DATABASE_URL || ""
};
