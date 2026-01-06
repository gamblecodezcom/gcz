from config import get_settings


def test_config():
    settings = get_settings()

    assert settings.JWT_SECRET, "JWT_SECRET missing"
    assert settings.DATABASE_URL, "DATABASE_URL missing"
    assert settings.OPENAI_MODEL, "OPENAI_MODEL missing"

    print("Config OK:", settings.PROJECT_NAME)