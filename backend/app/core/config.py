from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://user:password@localhost:5432/flowerspet_db"
    TELEGRAM_TOKEN: str = "your_telegram_token_here"
    CHAT_ID: str = "your_chat_id_here"
    TELEGRAM_BOT_TOKEN: str = "your_telegram_bot_token_here"
    SECRET_KEY: str = "change-me-to-a-random-secret-key-at-least-32-chars"
    ALGORITHM: str = "HS256"
    # Optional: set to your HTTPS domain to switch bot from polling → webhook mode
    # Example: "https://api.yourdomain.com/bot/webhook"
    BOT_WEBHOOK_URL: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
