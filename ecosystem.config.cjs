module.exports = {
  apps: [

    // =====================================================
    // TELEGRAM BOT — PRODUCTION (WEBHOOK MODE)
    // =====================================================
    {
      name: "gcz-bot",
      script: "bot.js",
      cwd: "/var/www/html/gcz/bot",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "300M",
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production"
      },

      // ---- LOG ROTATION ----
      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-bot-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-bot-error.log",

      // ---- HEALTH CHECK ----
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },

    // =====================================================
    // TELEGRAM WEBHOOK HANDLER — PRODUCTION
    // =====================================================
    {
      name: "gcz-webhook",
      script: "telegram-webhook.py",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production",
        PYTHONPATH: "/var/www/html/gcz"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-webhook-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-webhook-error.log",

      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },

    // =====================================================
    // FASTAPI — MAIN API
    // =====================================================
    {
      name: "gcz-api",
      script: "uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 8000",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production",
        PYTHONPATH: "/var/www/html/gcz"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-api-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-api-error.log",

      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },

    // =====================================================
    // FASTAPI — REDIRECT ENGINE
    // =====================================================
    {
      name: "gcz-redirect",
      script: "uvicorn",
      args: "backend.redirect:app --host 0.0.0.0 --port 8001",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production",
        PYTHONPATH: "/var/www/html/gcz"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-redirect-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-redirect-error.log",

      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },

    // =====================================================
    // FASTAPI — DROPS ENGINE
    // =====================================================
    {
      name: "gcz-drops",
      script: "uvicorn",
      args: "backend.drops:app --host 0.0.0.0 --port 8002",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production",
        PYTHONPATH: "/var/www/html/gcz"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-drops-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-drops-error.log",

      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },

    // =====================================================
    // DISCORD BOT
    // =====================================================
    {
      name: "gcz-discord",
      script: "start-discord.js",
      cwd: "/var/www/html/gcz/discord",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      node_args: "--experimental-modules",
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-discord-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-discord-error.log",

      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },

    // =====================================================
    // PYTHON WATCHDOG
    // =====================================================
    {
      name: "gcz-watchdog",
      script: "gcz_watchdog.py",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "200M",
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production",
        PYTHONPATH: "/var/www/html/gcz"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-watchdog-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-watchdog-error.log",

      min_uptime: "10s",
      max_restarts: 25,
      restart_delay: 5000
    },

    // =====================================================
    // AI ENGINE — PRODUCTION
    // =====================================================
    {
      name: "gcz-ai",
      script: "uvicorn",
      args: "ai.server:app --host 0.0.0.0 --port 8010",
      cwd: "/var/www/html/gcz",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env_file: "/var/www/html/gcz/.env",
      env: {
        NODE_ENV: "production",
        GCZ_ENV: "production",
        PYTHONPATH: "/var/www/html/gcz"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/gcz-ai-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-ai-error.log",

      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000
    },



    // =====================================================
    // ================= SANDBOX MIRROR ====================
    // =====================================================

    {
      name: "gcz-sandbox-ai",
      script: "uvicorn",
      args: "ai.server:app --host 0.0.0.0 --port 9010",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox",
      interpreter: "python3",
      exec_mode: "fork",
      env_file: "/var/www/html/gcz/.env.sandbox",
      instances: 1,
      env: {
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox",
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox"
      },

      merge_logs: true,
      max_size: "10M",
      retain: 10,
      time: true,

      out_file: "/var/www/html/gcz/logs/sandbox-ai-out.log",
      error_file: "/var/www/html/gcz/logs/sandbox-ai-error.log",

      min_uptime: "10s",
      max_restarts: 20,
      restart_delay: 4000
    }

  ]
};
