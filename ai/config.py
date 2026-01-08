CONFIG = {
    "owner": "GambleCodez",

    # ==========================================================
    # DATABASE — Primary
    # ==========================================================
    "db": {
        "provider": "neon_postgres",
        "env_var": "GCZ_DB",
        "description": "Primary production database for all GCZ services"
    },

    # ==========================================================
    # MEMORY / STATE LAYER
    # ==========================================================
    "memory": {
        "provider": "redis",
        "env_var": "REDIS_URL",
        "default": "redis://127.0.0.1:6379/3",
        "description": "Shared AI state & session memory"
    },

    # ==========================================================
    # CONTROL AUTH
    # ==========================================================
    "control": {
        "env_var": "GCZ_CONTROL_KEY",
        "required": True,
        "description": "Secure admin key for Codex control plane"
    },

    # ==========================================================
    # MCP ROUTING AWARENESS
    # ==========================================================
    "mcp": {
        "enabled": True,
        "bridge": "/mcp/event",
        "health_passthrough": True
    },

    "last_scan": "2026-01-03T16:44:02Z",

    # ==========================================================
    # SERVICES (PRODUCTION)
    # ==========================================================
    "services": {
        # ---------------- Core API ---------------- #
        "gcz-api": {
            "type": "fastapi",
            "port": 3000,
            "file": "backend/main.py",
            "health": "/health",
            "category": "core-api",
            "description": "Primary GCZ backend API"
        },

        # ---------------- Redirect Engine ---------------- #
        "gcz-redirect": {
            "type": "fastapi",
            "port": 8000,
            "file": "backend/redirect.py",
            "health": "/health",
            "category": "redirector",
            "description": "Shortlink + affiliate redirect engine"
        },

        # ---------------- Drops Engine ---------------- #
        "gcz-drops": {
            "type": "fastapi",
            "port": 8002,
            "file": "backend/drops.py",
            "health": "/health",
            "category": "drops",
            "description": "Daily drops, rewards, and sweepstakes engine"
        },

        # ---------------- Telegram Bot ---------------- #
        "gcz-bot": {
            "type": "telegram",
            "file": "bot/start-bot.js",
            "category": "bots",
            "description": "Telegram bot for GCZ community"
        },

        # ---------------- Discord Bot ---------------- #
        "gcz-discord": {
            "type": "discord",
            "file": "discord/start-discord.js",
            "category": "bots",
            "description": "Discord bot for GCZ community"
        },

        # ---------------- Watchdog (Legacy Node) ---------------- #
        "gcz-watchdog": {
            "type": "node",
            "file": "watchdog.js",
            "category": "monitoring",
            "description": "Node watchdog for uptime and service checks",
            "deprecated": True
        },

        # ---------------- AI Engine ---------------- #
        "gcz-ai": {
            "type": "python",
            "port": 8010,
            "file": "ai/server.py",
            "health": "/health",
            "category": "ai-core",
            "description": "AI memory, anomaly, and health engine"
        },

        # ---------------- Control Plane (NEW) ---------------- #
        "gcz-control": {
            "type": "fastapi",
            "port": 8088,
            "file": "gcz_codex_control.py",
            "health": "/health",
            "secure": True,
            "category": "ops",
            "description": "Codex Ops Control Plane API"
        }
    },

    # ==========================================================
    # SANDBOX MIRROR
    # ==========================================================
    "sandbox": {
        "active": True,
        "ai_url": "http://127.0.0.1:9010",
        "pm2_prefix": "gcz-sandbox-",
        "env_file": "/var/www/html/gcz/.env.sandbox",
        "notes": "Isolated AI experimentation + MCP sandbox mode"
    }
}