import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://helpdesk:helpdesk123@localhost:5432/helpdesk_ti",
    )
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", "super_secret_jwt_key_helpdesk_ti_2026_change_in_prod"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 horas
    TURNSTILE_SECRET: str = os.getenv("TURNSTILE_SECRET", "")
    UPLOAD_DIR: Path = Path(
        os.getenv(
            "UPLOAD_DIR",
            str(Path(__file__).resolve().parent.parent.parent / "uploads"),
        )
    )


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(settings.UPLOAD_DIR / "tickets").mkdir(parents=True, exist_ok=True)
(settings.UPLOAD_DIR / "activities").mkdir(parents=True, exist_ok=True)
