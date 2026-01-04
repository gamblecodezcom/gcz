CONFIG = {
    "owner": "GambleCodez",
    "db": {
        "provider": "neon_postgres",
        "env_var": "GCZ_DB",
        "description": "Primary production database for all GCZ services"
    },
    "last_scan": "2026-01-03T16:44:02Z",
    "services": {
        "gcz-api": {
            "type": "fastapi",
            "port": 3000,
            "file": "backend/main.py",
            "health": "/health",
            "category": "core-api",
            "description": "Primary GCZ backend API"
        },
        "gcz-redirect": {
            "type": "fastapi",
            "port": 8000,
            "file": "backend/redirect.py",
            "health": "/health",
            "category": "redirector",
            "description": "Shortlink + affiliate redirect engine"
        },
        "gcz-drops": {
            "type": "fastapi",
            "port": 8002,
            "file": "backend/drops.py",
            "health": "/health",
            "category": "drops",
            "description": "Daily drops, rewards, and sweepstakes engine"
        },
        "gcz-bot": {
            "type": "telegram",
            "file": "bot/start-bot.js",
            "category": "bots",
            "description": "Telegram bot for GCZ community"
        },
        "gcz-discord": {
            "type": "discord",
            "file": "discord/start-discord.js",
            "category": "bots",
            "description": "Discord bot for GCZ community"
        },
        "gcz-watchdog": {
            "type": "node",
            "file": "watchdog.js",
            "category": "monitoring",
            "description": "Node watchdog for uptime and service checks"
        },
        "gcz-ai": {
            "type": "python",
            "port": 8010,
            "file": "ai/health_engine.py",
            "health": "/health",
            "category": "ai-core",
            "description": "AI memory, anomaly, and health engine"
        }
    }
}