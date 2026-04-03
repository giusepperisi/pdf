from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://socialposter:socialposter@localhost:5432/socialposter"
    gemini_api_key: Optional[str] = None
    huggingface_token: Optional[str] = None
    cloudinary_cloud_name: Optional[str] = None
    cloudinary_api_key: Optional[str] = None
    cloudinary_api_secret: Optional[str] = None
    secret_key: str = "change-this-secret-key"
    fernet_key: Optional[str] = None
    vite_api_base_url: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
