# backend/app/config.py
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # --- Project Metadata ---
    PROJECT_NAME: str = "Miyog Engine"
    API_V1_STR: str = "/api"

    # --- Database (Matches your .env) ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # --- Supabase Auth ---
    SUPABASE_JWT_SECRET: str
    SUPABASE_ANON_KEY: str
    SUPABASE_URL: Optional[str] = None

    # --- Redis / Celery ---
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # --- AI Spaces & Tokens ---
    HF_TOKEN: str
    SCRIPT_SPACE_ID: str = "amoghkrishnan/script_gen"
    VOICE_SPACE_ID: str = "amoghkrishnan/chatterbox-tts"
    VIDEO_SPACE_ID: str = "amoghkrishnan/TEXT-TO-VIDEO"
    VIDEO_JSON_SPACE_ID: str = "amoghkrishnan/VIDEO-TIMESTAMPED-JSON"

    # --- External APIs ---
    GEMINI_API_KEY: str
    PIXABAY_API_KEY: str

    # --- AWS S3 Config ---
    AWS_REGION: str
    S3_BUCKET_NAME: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        """
        Constructs the connection string.
        Automatically adds SSL mode for Supabase Pooler (Port 6543).
        """
        base_url = f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        # Port 6543 (Pooler) requires SSL mode
        if str(self.POSTGRES_PORT) == "6543":
            return f"{base_url}?sslmode=require"
        return base_url

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Fixed Import for Worker
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL
