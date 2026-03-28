from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Money Mentor - AI Personal Finance"
    MONGO_URI: str = "mongodb://localhost:27017/finance_ai"
    DATABASE_NAME: str = "finance_ai"
    SECRET_KEY: str = "your-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    GROQ_API_KEY: str = "your-groq-api-key"

    class Config:
        env_file = ".env"

settings = Settings()
