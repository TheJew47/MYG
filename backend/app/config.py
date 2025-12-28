# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # --- Database ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # --- Redis / Celery (REQUIRED) ---
    # These must be here for worker/tasks.py to work
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # --- Supabase Auth ---
    SUPABASE_JWT_SECRET: str
    SUPABASE_ANON_KEY: str
    SUPABASE_URL: Optional[str] = None

    # --- AI Spaces & Tokens ---
    HF_TOKEN: str
    VOICE_SPACE_ID: str = "amoghkrishnan/chatterbox-tts"
    SCRIPT_SPACE_ID: str = "amoghkrishnan/script_gen"
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
        """Constructs the connection string with SSL for Port 6543."""
        base_url = f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        if str(self.POSTGRES_PORT) == "6543":
            return f"{base_url}?sslmode=require"
        return base_url

    class Config:
        env_file = ".env"
        # Set to False so both settings.CELERY_BROKER_URL and 
        # settings.celery_broker_url work automatically
        case_sensitive = False

# Initialize settings
settings = Settings()

# --- LAUNCH DEBUGGING ---
print("\n" + "🔍" * 5 + " ENVIRONMENT CHECK " + "🔍" * 5)
print(f"HOST:   {settings.POSTGRES_HOST}")
print(f"USER:   {settings.POSTGRES_USER}")
print(f"PORT:   {settings.POSTGRES_PORT}")
print(f"BROKER: {settings.CELERY_BROKER_URL}")

def debug_mask(val: str):
    if not val or len(val) < 10: return "MISSING"
    return f"{val[:10]}... (len: {len(val)})"

print(f"JWT:    {debug_mask(settings.SUPABASE_JWT_SECRET)}")
print(f"ANON:   {debug_mask(settings.SUPABASE_ANON_KEY)}")
print("=" * 40 + "\n")

# Export for worker
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL
