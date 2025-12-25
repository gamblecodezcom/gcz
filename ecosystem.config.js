module.exports = {
  apps: [
    {
      name: "gcz-api",
      script: "./server.js",
      cwd: "/root/gcz",
      watch: false,
      autorestart: true,
      env_file: "./.env",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "gcz-bot",
      script: "./start-bot.js",
      cwd: "/root/gcz",
      watch: false,
      autorestart: true,
      env_file: "./.env",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "gcz-redirect",
      script: "/root/gcz/venv/bin/uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 8000",
      cwd: "/root/gcz",
      interpreter: "none",
      watch: false,
      autorestart: true,
      env_file: "./.env",
      env: {
        PYTHONUNBUFFERED: "1"
      }
    },
    {
      name: "gcz-watchdog",
      script: "./watchdog.js",
      cwd: "/root/gcz",
      watch: false,
      autorestart: true,
      env_file: "./.env",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
