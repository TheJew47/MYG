# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_ANON_KEY: str
    HF_TOKEN: str
    GEMINI_API_KEY: str
    PIXABAY_API_KEY: str
    AWS_REGION: str
    S3_BUCKET_NAME: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    
    VOICE_SPACE_ID: str = "amoghkrishnan/chatterbox-tts"
    # Added other missing attributes to prevent crashes
    SCRIPT_SPACE_ID: str = "amoghkrishnan/script_gen"
    VIDEO_SPACE_ID: str = "amoghkrishnan/TEXT-TO-VIDEO"
    VIDEO_JSON_SPACE_ID: str = "amoghkrishnan/VIDEO-TIMESTAMPED-JSON"

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        # Transaction Pooler (Port 6543) MANDATES sslmode=require
        base_url = f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        if str(self.POSTGRES_PORT) == "6543":
            return f"{base_url}?sslmode=require"
        return base_url

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# --- LAUNCH DEBUGGING ---
print("\n" + "🔍" * 5 + " ENVIRONMENT CHECK " + "🔍" * 5)
print(f"HOST: {settings.POSTGRES_HOST}")
print(f"USER: {settings.POSTGRES_USER}")
print(f"PORT: {settings.POSTGRES_PORT}")
if "bvlhcjgyuetelksvryly" not in settings.POSTGRES_USER:
    print("❌ ERROR: Username is missing project reference!")
print("=" * 40 + "\n")

DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL
