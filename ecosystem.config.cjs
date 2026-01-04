module.exports = {
  apps: [
    // =====================================================
    // TELEGRAM BOT (PRODUCTION)
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
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
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
        PYTHONPATH: "/var/www/html/gcz",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
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
        PYTHONPATH: "/var/www/html/gcz",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
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
        PYTHONPATH: "/var/www/html/gcz",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
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
      env: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/logs/gcz-discord-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-discord-error.log"
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
      env: {
        PYTHONPATH: "/var/www/html/gcz",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/logs/gcz-watchdog-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-watchdog-error.log"
    },

    // =====================================================
    // AI ENGINE (FastAPI server.py via uvicorn)
    // =====================================================
    {
      name: "gcz-ai",
      script: "uvicorn",
      args: "server:app --host 0.0.0.0 --port 8010",
      cwd: "/var/www/html/gcz/ai",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        GCZ_ENV: "prod",
        PYTHONPATH: "/var/www/html/gcz/ai",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/logs/gcz-ai-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-ai-error.log"
    },

    // =====================================================
    // GCZ CLI MCP SERVER (TYPESCRIPT → RUNS dist/gcz.js)
    // =====================================================
    {
      name: "gcz-mcp",
      script: "dist/gcz.js",
      cwd: "/var/www/html/gcz/cli",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL,
        GCZ_AI_URL: "http://127.0.0.1:8010"
      },
      out_file: "/var/www/html/gcz/logs/gcz-mcp-out.log",
      error_file: "/var/www/html/gcz/logs/gcz-mcp-error.log"
    }
  ]
};
