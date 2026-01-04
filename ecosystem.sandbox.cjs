module.exports = {
  apps: [
    // =====================================================
    // SANDBOX MCP (TypeScript via ts-node)
    // =====================================================
    {
      name: "gcz-sandbox-mcp",
      script: "src/index.ts",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/mcp",
      interpreter: "node",
      interpreter_args: "-r ts-node/register",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-mcp-out.log",
      error_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-mcp-error.log"
    },

    // =====================================================
    // SANDBOX API
    // =====================================================
    {
      name: "gcz-sandbox-api",
      script: "uvicorn",
      args: "main:app --host 0.0.0.0 --port 9000",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/apps/api",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox/apps/api",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-api-out.log",
      error_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-api-error.log"
    },

    // =====================================================
    // SANDBOX BOT
    // =====================================================
    {
      name: "gcz-sandbox-bot",
      script: "bot.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/apps/bot",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-bot-out.log",
      error_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-bot-error.log"
    },

    // =====================================================
    // SANDBOX DISCORD
    // =====================================================
    {
      name: "gcz-sandbox-discord",
      script: "start-discord.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/apps/discord",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-discord-out.log",
      error_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-discord-error.log"
    },

    // =====================================================
    // SANDBOX DROPS
    // =====================================================
    {
      name: "gcz-sandbox-drops",
      script: "uvicorn",
      args: "drops:app --host 0.0.0.0 --port 9002",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/apps/drops",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox/apps/drops",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-drops-out.log",
      error_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-drops-error.log"
    },

    // =====================================================
    // SANDBOX REDIRECT
    // =====================================================
    {
      name: "gcz-sandbox-redirect",
      script: "uvicorn",
      args: "redirect:app --host 0.0.0.0 --port 9001",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/apps/redirect",
      interpreter: "python3",
      exec_mode: "fork",
      instances: 1,
      env: {
        PYTHONPATH: "/var/www/html/gcz/ai/gcz-sandbox/apps/redirect",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-redirect-out.log",
      error_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-redirect-error.log"
    },

    // =====================================================
    // SANDBOX WATCHDOG
    // =====================================================
    {
      name: "gcz-sandbox-watchdog",
      script: "watchdog.js",
      cwd: "/var/www/html/gcz/ai/gcz-sandbox/apps/watchdog",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
        DATABASE_URL: process.env.DATABASE_URL,
        AI_AGENT_NEON_DB_URL: process.env.AI_AGENT_NEON_DB_URL
      },
      out_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-watchdog-out.log",
      error_file: "/var/www/html/gcz/ai/gcz-sandbox/logs/gcz-sandbox-watchdog-error.log"
    }
  ]
};