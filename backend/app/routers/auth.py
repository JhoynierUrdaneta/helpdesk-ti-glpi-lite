from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import httpx

from ..config import settings
from ..database import get_db
from ..models import User, LoginLog
from ..schemas import LoginRequest, ChangePasswordRequest, TokenResponse, UserOut
from ..auth import (
    verify_password,
    hash_password,
    create_access_token,
    is_brute_force_locked,
    record_failed_attempt,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "0.0.0.0"
    usuario = payload.usuario.strip()

    if is_brute_force_locked(db, client_ip, usuario):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos fallidos (máx. 7). Por seguridad, espera 15 minutos.",
        )

    # Si TURNSTILE_SECRET está configurado en el entorno, validar contra Cloudflare
    if settings.TURNSTILE_SECRET:
        if not payload.turnstile_token:
            record_failed_attempt(db, client_ip, usuario)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validación de seguridad (Captcha) requerida.",
            )
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.TURNSTILE_SECRET,
                    "response": payload.turnstile_token,
                    "remoteip": client_ip,
                },
            )
            data = resp.json()
            if not data.get("success"):
                record_failed_attempt(db, client_ip, usuario)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Validación de seguridad (Captcha) incorrecta.",
                )

    user = (
        db.query(User)
        .filter(User.usuario == usuario, User.activo == True)
        .first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        record_failed_attempt(db, client_ip, usuario)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
        )

    # Si la contraseña en texto plano coincide con su nombre de usuario, forzar cambio
    if payload.password == user.usuario and not user.must_change_password:
        user.must_change_password = True
        db.commit()
        db.refresh(user)

    # Registrar en bitácora de logins si no requiere cambio o al autenticarse
    log_entry = LoginLog(
        usuario_id=user.id,
        nombre=user.nombre,
        usuario=user.usuario,
        ip=client_ip,
    )
    db.add(log_entry)
    db.commit()

    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        must_change_password=user.must_change_password,
        user=UserOut.model_validate(user),
    )


@router.post("/change-password", response_model=TokenResponse)
def change_initial_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden.",
        )

    if payload.new_password == current_user.usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a tu nombre de usuario.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.commit()
    db.refresh(current_user)

    token = create_access_token(current_user)
    return TokenResponse(
        access_token=token,
        must_change_password=False,
        user=UserOut.model_validate(current_user),
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
