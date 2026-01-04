from backend.config import get_settings

settings = get_settings()


def get_ai_profile(provider: str):
    """
    Returns API key, model, and base URL for the selected provider.
    Unified GCZ AI provider registry.
    """

    profiles = {
        "openai": {
            "api_key": settings.OPENAI_API_KEY,
            "model": settings.OPENAI_MODEL,
            "base": "https://api.openai.com/v1",
        },
        "perplexity": {
            "api_key": settings.PERPLEXITY_API_KEY,
            "model": settings.PERPLEXITY_MODEL,
            "base": "https://api.perplexity.ai",
        },
        "cursor": {
            "api_key": settings.CURSOR_API_KEY,
            "model": settings.CURSOR_MODEL,
            "base": settings.CURSOR_API_BASE,
        },
        "goose": {
            "api_key": settings.GOOSE_API_KEY,
            "model": settings.GOOSE_MODEL,
            "base": settings.GOOSE_API_BASE,
        },
        "anthropic": {
            "api_key": settings.ANTHROPIC_API_KEY,
            "model": settings.ANTHROPIC_MODEL,
            "base": "https://api.anthropic.com/v1",
        },
        "openrouter": {
            "api_key": settings.OPENROUTER_API_KEY,
            "model": settings.OPENROUTER_MODEL,
            "base": "https://openrouter.ai/api/v1",
        },
    }

    return profiles.get(provider)