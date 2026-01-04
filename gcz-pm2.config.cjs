module.exports = {
  apps: [
    {
      name: "gcz-bot",
      script: "bot.js",
      cwd: "/var/www/html/gcz/bot",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "gcz-api",
      script: "uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 8000",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1
    },
    {
      name: "gcz-redirect",
      script: "uvicorn",
      args: "backend.redirect:app --host 0.0.0.0 --port 8001",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1
    },
    {
      name: "gcz-drops",
      script: "uvicorn",
      args: "backend.drops:app --host 0.0.0.0 --port 8002",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1
    },
    {
      name: "gcz-discord",
      script: "start-discord.js",
      cwd: "/var/www/html/gcz/discord",
      exec_mode: "fork",
      instances: 1
    },
    {
      name: "gcz-watchdog",
      script: "watchdog.js",
      cwd: "/var/www/html/gcz/bot",
      exec_mode: "fork",
      instances: 1
    }
  ]
};