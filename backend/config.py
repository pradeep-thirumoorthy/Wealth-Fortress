import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Wealth Fortress - AI Portfolio Intelligence Platform"
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "portfolio_db")
    CDP_URL: str = os.getenv("CDP_URL", "http://localhost:9222")
    SCREENER_BASE_URL: str = "https://www.screener.in"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6KSUJ4Z7rgj-sX1qkMA8d6cGmyyjvqgpi_uJarwR7ZQsw")
    GEMINI_PRIMARY_MODEL: str = "gemini-3.7-flash"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    JITTER_MIN_SEC: float = 4.0
    JITTER_MAX_SEC: float = 10.0
    DELTA_COOLDOWN_HOURS: float = 24.0

settings = Settings()
