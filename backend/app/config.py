# myg/backend/app/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Miyog Engine"
    API_V1_STR: str = "/api"
    
    # --- DATABASE CONFIG ---
    DB_USER: str = os.getenv("POSTGRES_USER", "postgres")      
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "dev_pass")
    DB_HOST: str = os.getenv("POSTGRES_HOST", "localhost")      
    DB_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME: str = os.getenv("POSTGRES_DB", "miyog_db")
    
    # --- CELERY / BROKER ---
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
    
    # --- AI SPACES & TOKENS ---
    HF_TOKEN: str = os.getenv("HF_TOKEN", "") 
    
    # Hugging Face Space IDs
    SCRIPT_SPACE_ID: str = os.getenv("SCRIPT_SPACE_ID", "amoghkrishnan/script_gen")
    VOICE_SPACE_ID: str = os.getenv("VOICE_SPACE_ID", "") 
    VIDEO_SPACE_ID: str = os.getenv("VIDEO_SPACE_ID", "amoghkrishnan/TEXT-TO-VIDEO")
    
    # NEW: Your optimized JSON space
    VIDEO_JSON_SPACE_ID: str = os.getenv("VIDEO_JSON_SPACE_ID", "amoghkrishnan/VIDEO-TIMESTAMPED-JSON")
    
    PIXABAY_API_KEY: str = os.getenv("PIXABAY_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # --- AWS S3 ---
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-2")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "miyog-video-assets") 
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")

settings = Settings()

DATABASE_URL = (
    f"postgresql+psycopg2://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)