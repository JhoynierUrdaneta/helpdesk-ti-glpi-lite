import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .config import settings
from .database import get_db
from .models import User, LoginAttempt

security = HTTPBearer()

ALLOWED_TICKET_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
ALLOWED_TICKET_MIMES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "usuario": user.usuario,
        "rol": user.rol,
        "must_change_password": user.must_change_password,
        "tv": user.token_version or 1,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def is_brute_force_locked(db: Session, ip: str, usuario: str) -> bool:
    cutoff = datetime.utcnow() - timedelta(minutes=15)
    pair_count = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.ip == ip,
            LoginAttempt.usuario == usuario,
            LoginAttempt.fecha >= cutoff,
        )
        .count()
    )
    ip_count = (
        db.query(LoginAttempt)
        .filter(LoginAttempt.ip == ip, LoginAttempt.fecha >= cutoff)
        .count()
    )
    return pair_count >= 7 or ip_count >= 20


def clear_failed_attempts(db: Session, ip: str, usuario: str) -> None:
    db.query(LoginAttempt).filter(
        LoginAttempt.ip == ip, LoginAttempt.usuario == usuario
    ).delete(synchronize_session=False)


def record_failed_attempt(db: Session, ip: str, usuario: str) -> None:
    attempt = LoginAttempt(ip=ip, usuario=usuario, fecha=datetime.utcnow())
    db.add(attempt)
    db.commit()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = int(payload.get("sub", 0))
        token_version = int(payload.get("tv", 1))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de sesión inválido o expirado.",
        )

    user = db.query(User).filter(User.id == user_id, User.activo == True).first()
    if not user or (user.token_version or 1) != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado, inactivo o sesión revocada.",
        )
    return user


def get_active_verified_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes cambiar tu contraseña temporal antes de continuar.",
        )
    return current_user


def require_admin(current_user: User = Depends(get_active_verified_user)) -> User:
    if current_user.rol != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de Administrador (ADMIN).",
        )
    return current_user


async def save_validated_upload(
    file: Optional[UploadFile],
    subfolder: str,
    images_only: bool = False,
) -> Optional[str]:
    if not file or not file.filename:
        return None

    ext = Path(file.filename).suffix.lower()
    allowed_exts = ALLOWED_IMAGE_EXTENSIONS if images_only else ALLOWED_TICKET_EXTENSIONS
    allowed_mimes = ALLOWED_IMAGE_MIMES if images_only else ALLOWED_TICKET_MIMES

    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido ({ext}). Permitidos: {', '.join(sorted(allowed_exts))}",
        )

    if file.content_type and file.content_type.lower() not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo MIME no permitido ({file.content_type}).",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo supera el tamaño máximo permitido de 10 MB.",
        )

    safe_name = f"{subfolder}_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:8]}{ext}"
    target_dir = settings.UPLOAD_DIR / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / safe_name
    target_path.write_bytes(content)

    return f"/uploads/{subfolder}/{safe_name}"
