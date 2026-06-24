from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./gameplatform.db"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBAPP_URL: str = "https://your-domain.com"
    SMS_API_KEY: str = ""
    SMS_API_URL: str = ""
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
