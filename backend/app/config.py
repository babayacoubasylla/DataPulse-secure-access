from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "DataPulse API"
    app_env: str = "development"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "sqlite:///./datapulse.db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
