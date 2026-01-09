module.exports = {
  apps: [

    {
      name: "gcz-bot",
      script: "bot.js",
      cwd: "/var/www/html/gcz/bot",
      interpreter: "/usr/local/bin/node",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "300M",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production" },
      merge_logs: true,
      time: true,
      out_file: "/var/www/html/gcz/logs/gcz-bot-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-bot-error.log",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },

    {
      name: "gcz-webhook",
      script: "telegram-webhook.py",
      cwd: "/var/www/html/gcz",
      interpreter: "/usr/bin/python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production", PYTHONPATH: "/var/www/html/gcz" }
    },

    {
      name: "gcz-api",
      script: "uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 8000",
      cwd: "/var/www/html/gcz",
      interpreter: "/usr/bin/python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production", PYTHONPATH: "/var/www/html/gcz" }
    },

    {
      name: "gcz-redirect",
      script: "uvicorn",
      args: "backend.redirect:app --host 0.0.0.0 --port 8001",
      cwd: "/var/www/html/gcz",
      interpreter: "/usr/bin/python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production", PYTHONPATH: "/var/www/html/gcz" }
    },

    {
      name: "gcz-drops",
      script: "uvicorn",
      args: "backend.drops:app --host 0.0.0.0 --port 8002",
      cwd: "/var/www/html/gcz",
      interpreter: "/usr/bin/python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production",
        PYTHONPATH: "/var/www/html/gcz",
        PROMO_AI_MODE: "production"   // <-- explicit guarantee
      }
    },

    {
      name: "gcz-discord",
      script: "start-discord.js",
      cwd: "/var/www/html/gcz/discord",
      interpreter: "/usr/local/bin/node",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production" }
    },

    {
      name: "gcz-watchdog",
      script: "gcz_watchdog.py",
      cwd: "/var/www/html/gcz",
      interpreter: "/usr/bin/python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production", PYTHONPATH: "/var/www/html/gcz" }
    },

    {
      name: "gcz-ai-watchdog",
      script: "ai/ai_watchdog.py",
      cwd: "/var/www/html/gcz",
      interpreter: "/usr/bin/python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production", PYTHONPATH: "/var/www/html/gcz" }
    },

    {
      name: "gcz-ai",
      script: "uvicorn",
      args: "ai.server:app --host 0.0.0.0 --port 8010",
      cwd: "/var/www/html/gcz",
      interpreter: "/usr/bin/python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env",
      env: { NODE_ENV: "production", GCZ_ENV: "production", PYTHONPATH: "/var/www/html/gcz" }
    }

  ]
};
