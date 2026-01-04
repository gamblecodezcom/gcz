module.exports = {
  apps: [
    // =====================================================
    // TELEGRAM BOT
    // =====================================================
    {
      name: "gcz-bot",
      script: "bot.js",
      cwd: "/var/www/html/gcz/bot",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      },
      out_file: "/var/www/html/gcz/logs/gcz-bot-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-bot-error.log"
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
      env: {
        PYTHONPATH: "/var/www/html/gcz"
      },
      out_file: "/var/www/html/gcz/logs/gcz-api-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-api-error.log"
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
      env: {
        PYTHONPATH: "/var/www/html/gcz"
      },
      out_file: "/var/www/html/gcz/logs/gcz-redirect-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-redirect-error.log"
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
      env: {
        PYTHONPATH: "/var/www/html/gcz"
      },
      out_file: "/var/www/html/gcz/logs/gcz-drops-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-drops-error.log"
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
      out_file: "/var/www/html/gcz/logs/gcz-discord-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-discord-error.log"
    },

    // =====================================================
    // WATCHDOG
    // =====================================================
    {
      name: "gcz-watchdog",
      script: "watchdog.js",
      cwd: "/var/www/html/gcz/bot",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "150M",
      out_file: "/var/www/html/gcz/logs/gcz-watchdog-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-watchdog-error.log"
    },

    // =====================================================
    // AI CORE (PYTHON)
    // =====================================================
    {
      name: "gcz-ai-core",
      script: "/var/www/html/gcz/gcz-ai-core.py",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        PYTHONPATH: "/var/www/html/gcz"
      },
      out_file: "/var/www/html/gcz/logs/gcz-ai-core-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-ai-core-error.log"
    }
  ]
};
