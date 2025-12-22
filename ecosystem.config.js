// pm2.config.cjs

module.exports = {
  apps: [
    {
      name: "gamblecodez-api",
      script: "uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 8000",
      interpreter: "python3",
      exec_mode: "fork",
      watch: false,
      env: {
        PYTHONUNBUFFERED: "1",
        LOG_LEVEL: "info",

        // ✅ Primary envs (fallback safe)
        DATABASE_URL: process.env.DATABASE_URL || "sqlite:///./gcz.db",
        SECRET_KEY: process.env.SECRET_KEY || "supersecret",
        CORS_ORIGINS: process.env.CORS_ORIGINS || "*",

        // ✅ Optional toggles
        OPENAPI_MODE: process.env.OPENAPI_MODE || "admin",
        ADMIN_AUTH_SOURCE: process.env.ADMIN_AUTH_SOURCE || "both",
        VALIDATION_STRICT: process.env.VALIDATION_STRICT || "hardcore",
        HEALTH_DEPTH: process.env.HEALTH_DEPTH || "lightweight"
      },
    },
  ],
};