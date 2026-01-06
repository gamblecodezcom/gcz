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
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox"
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
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox"
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
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox"
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
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox"
      }
    },

    // =====================================================
    // DISCORD BOT — SANDBOX (READ ONLY)
    // =====================================================
    {
      name: "gcz-sandbox-discord",
      script: "start-discord.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/discord",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      node_args: "--experimental-modules",
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox"
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
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox"
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
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        GCZ_ENV: "sandbox",
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox",
        NODE_ENV: "sandbox"
      }
    },

    // =====================================================
    // MCP CLI SERVER — SANDBOX
    // =====================================================
    {
      name: "gcz-sandbox-mcp",
      script: "dist/gcz.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/cli",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      env_file: "/var/www/html/gcz/.env.sandbox",
      env: {
        NODE_ENV: "sandbox",
        GCZ_ENV: "sandbox",
        GCZ_AI_URL: "http://127.0.0.1:9010"
      }
    }
  ]
};