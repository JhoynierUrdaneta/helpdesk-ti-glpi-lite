from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserOut, UserCreate, UserUpdate
from ..auth import get_active_verified_user, require_admin, hash_password

router = APIRouter(prefix="/api/users", tags=["Usuarios TI"])


@router.get("/technicians", response_model=List[UserOut])
def list_active_technicians(
    db: Session = Depends(get_db),
    _: User = Depends(get_active_verified_user),
):
    """Lista los integrantes activos del área TI para asignación de tickets."""
    users = (
        db.query(User)
        .filter(User.activo == True)
        .order_by(User.nombre.asc())
        .all()
    )
    return users


@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).order_by(User.rol.asc(), User.nombre.asc()).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    usuario = payload.usuario.strip()
    nombre = payload.nombre.strip()
    existing = db.query(User).filter(User.usuario == usuario).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El nombre de usuario '{usuario}' ya está registrado.",
        )

    # Contraseña inicial igual al nombre de usuario → obliga cambio en el primer login
    user = User(
        nombre=nombre,
        usuario=usuario,
        password_hash=hash_password(usuario),
        rol=payload.rol if payload.rol in ("ADMIN", "USER") else "USER",
        activo=True,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario = payload.usuario.strip()
    duplicate = (
        db.query(User)
        .filter(User.usuario == usuario, User.id != user_id)
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El usuario '{usuario}' ya pertenece a otra cuenta.",
        )

    if user.id == current_admin.id and not payload.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta en sesión.",
        )

    user.nombre = payload.nombre.strip()
    user.usuario = usuario
    user.rol = payload.rol if payload.rol in ("ADMIN", "USER") else user.rol
    user.activo = payload.activo

    if payload.reset_password:
        user.password_hash = hash_password(usuario)
        user.must_change_password = True

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    try:
        db.delete(user)
        db.commit()
        return {"ok": True, "action": "deleted"}
    except Exception:
        db.rollback()
        # Si tiene tickets históricos vinculados, lo desactivamos de forma segura
        user.activo = False
        db.commit()
        return {"ok": True, "action": "deactivated"}
