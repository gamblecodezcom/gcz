module.exports = {
  apps: [
    {
      name: "gcz-api",
      script: "uvicorn",
      args: "gcz_site_upgrade.backend.app:app --host 0.0.0.0 --port 8000",
      interpreter: "python3",
      env: {
        PYTHONUNBUFFERED: "1",
        DATABASE_URL: process.env.DATABASE_URL || "sqlite:///./gcz.db",
        SECRET_KEY: process.env.SECRET_KEY || "change-me",
        CORS_ORIGINS: process.env.CORS_ORIGINS || "*",
      },
    },
  ],
};