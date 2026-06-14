from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DataPulse API"
    app_env: str = "development"
    frontend_url: str = "http://localhost:5173"

    # En local : sqlite:///./datapulse.db
    # En production Supabase : postgresql://...?...sslmode=require
    database_url: str = "sqlite:///./datapulse.db"

    jwt_secret_key: str = "change-this-secret-key-in-production"
    access_token_expire_minutes: int = 1440

    # Email qui deviendra automatiquement platform_admin à l’inscription
    platform_admin_email: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()