# miyog/backend/app/config.py (REPLACED ENTIRE FILE)
import os
from pydantic_settings import BaseSettings # Note: assuming pydantic-settings is available as per requirements.txt

class Settings(BaseSettings):
    PROJECT_NAME: str = "Miyog Engine"
    API_V1_STR: str = "/api"
    
    # --- DATABASE CONFIG (PostgreSQL) ---
    # These must be set as environment variables on your EC2/Lambda deployment
    DB_USER: str = os.getenv("POSTGRES_USER", "postgres")      
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "dev_pass")
    DB_HOST: str = os.getenv("POSTGRES_HOST", "localhost")      
    DB_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME: str = os.getenv("POSTGRES_DB", "miyog_db")
    
    # --- CELERY / BROKER (Default for Docker, will be SQS in final step) ---
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
    
    # --- AWS S3 & API Keys ---
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    PIXABAY_API_KEY: str = os.getenv("PIXABAY_API_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-2") # Use your chosen AWS region
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "miyog-video-assets") 
    # Used for local testing, IAM roles override this in AWS
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")

settings = Settings()

# The SQLAlchemy URL string format
DATABASE_URL = (
    f"postgresql+psycopg2://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)