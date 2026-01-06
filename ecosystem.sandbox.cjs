module.exports = {
  apps: [
    // =====================================================
    // TELEGRAM BOT — SANDBOX
    // =====================================================
    {
      name: "gcz-sandbox-bot",
      script: "bot.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/bot",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      }
    },

    // =====================================================
    // FASTAPI — MAIN API (SANDBOX)
    // =====================================================
    {
      name: "gcz-sandbox-api",
      script: "uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 9000",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      }
    },

    // =====================================================
    // FASTAPI — REDIRECT ENGINE (SANDBOX)
    // =====================================================
    {
      name: "gcz-sandbox-redirect",
      script: "uvicorn",
      args: "backend.redirect:app --host 0.0.0.0 --port 9001",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      }
    },

    // =====================================================
    // FASTAPI — DROPS ENGINE (SANDBOX)
    // =====================================================
    {
      name: "gcz-sandbox-drops",
      script: "uvicorn",
      args: "backend.drops:app --host 0.0.0.0 --port 9002",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      }
    },

    // =====================================================
    // DISCORD BOT — SANDBOX
    // =====================================================
    {
      name: "gcz-sandbox-discord",
      script: "start-discord.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/discord",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      node_args: "--experimental-modules",
      env: {
        NODE_ENV: "sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      }
    },

    // =====================================================
    // WATCHDOG — SANDBOX
    // =====================================================
    {
      name: "gcz-sandbox-watchdog",
      script: "gcz_watchdog.py",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "200M",
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      }
    },

    // =====================================================
    // AI ENGINE — SANDBOX
    // =====================================================
    {
      name: "gcz-sandbox-ai",
      script: "uvicorn",
      args: "ai.server:app --host 0.0.0.0 --port 9010",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        GCZ_ENV: "sandbox",
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      }
    },

    // =====================================================
    // MCP CLI SERVER — SANDBOX (WITH CP)
    // =====================================================
    {
      name: "gcz-sandbox-mcp",
      script: "dist/gcz.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/cli",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "sandbox",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL,
        GCZ_AI_URL: "http://127.0.0.1:9010"
      }
    }
  ]
};