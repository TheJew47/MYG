# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database (Matches .env)
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    
    # Supabase Auth
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: str
    SUPABASE_ANON_KEY: Optional[str] = None

    # External APIs
    GEMINI_API_KEY: str
    PIXABAY_API_KEY: str
    HF_TOKEN: str

    # AWS S3
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str
    S3_BUCKET_NAME: str

    # Redis/Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        """
        Constructs the connection string. 
        Automatically adds SSL for Supabase Pooler (Port 6543).
        """
        base_url = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        # The Supabase Pooler on port 6543 requires SSL mode
        if str(self.POSTGRES_PORT) == "6543":
            return f"{base_url}?sslmode=require"
        return base_url

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
