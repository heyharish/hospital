"""
config.py

Loads all configuration from environment variables. NOTHING sensitive
is hard-coded here (see Section 32/33 of the project spec).

Copy .env.example to .env and fill in your real values before running.
"""

import os
from dotenv import load_dotenv

load_dotenv()  # reads variables from a local .env file, if present


class Settings:
    # --- Database ---
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "hospital_readmission_db")

    @property
    def DATABASE_URL(self) -> str:
        from urllib.parse import quote_plus
        user = quote_plus(self.DB_USER)
        password = quote_plus(self.DB_PASSWORD)
        return (
            f"mysql+pymysql://{user}:{password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # --- JWT Auth ---
    JWT_SECRET: str = os.getenv("JWT_SECRET", "CHANGE_ME_IN_ENV_FILE")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24h default

    # --- CORS ---
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173"
    ).split(",")


settings = Settings()