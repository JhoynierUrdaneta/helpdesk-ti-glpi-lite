from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Sede, Categoria, Subcategoria, User
from ..schemas import SedeOut, CategoriaOut, SubcategoriaOut, CatalogItemCreate
from ..auth import get_active_verified_user, require_admin

router = APIRouter(prefix="/api/catalogs", tags=["Catálogos"])


@router.get("/all")
def get_all_catalogs(
    db: Session = Depends(get_db),
    _: User = Depends(get_active_verified_user),
):
    sedes = db.query(Sede).order_by(Sede.nombre.asc()).all()
    categorias = db.query(Categoria).order_by(Categoria.nombre.asc()).all()
    subcategorias = db.query(Subcategoria).order_by(Subcategoria.nombre.asc()).all()
    return {
        "sedes": [SedeOut.model_validate(s) for s in sedes],
        "categorias": [CategoriaOut.model_validate(c) for c in categorias],
        "subcategorias": [SubcategoriaOut.model_validate(sc) for sc in subcategorias],
    }


@router.post("/sedes", response_model=SedeOut)
def create_sede(
    payload: CatalogItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    nombre = payload.nombre.strip()
    existing = db.query(Sede).filter(Sede.nombre == nombre).first()
    if existing:
        return existing
    sede = Sede(nombre=nombre)
    db.add(sede)
    db.commit()
    db.refresh(sede)
    return sede


@router.delete("/sedes/{sede_id}")
def delete_sede(
    sede_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    sede = db.query(Sede).filter(Sede.id == sede_id).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada.")
    try:
        db.delete(sede)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la sede porque tiene tickets asociados.",
        )
    return {"ok": True}


@router.post("/categorias", response_model=CategoriaOut)
def create_categoria(
    payload: CatalogItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    nombre = payload.nombre.strip()
    existing = db.query(Categoria).filter(Categoria.nombre == nombre).first()
    if existing:
        return existing
    cat = Categoria(nombre=nombre)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categorias/{categoria_id}")
def delete_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    try:
        db.delete(cat)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la categoría porque tiene tickets asociados.",
        )
    return {"ok": True}


@router.post("/subcategorias", response_model=SubcategoriaOut)
def create_subcategoria(
    payload: CatalogItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    nombre = payload.nombre.strip()
    if not payload.categoria_id:
        first_cat = db.query(Categoria).order_by(Categoria.id.asc()).first()
        if not first_cat:
            raise HTTPException(
                status_code=400, detail="Crea primero al menos una categoría."
            )
        cat_id = first_cat.id
    else:
        cat_id = payload.categoria_id

    sub = Subcategoria(nombre=nombre, categoria_id=cat_id)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/subcategorias/{subcategoria_id}")
def delete_subcategoria(
    subcategoria_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    sub = db.query(Subcategoria).filter(Subcategoria.id == subcategoria_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategoría no encontrada.")
    try:
        db.delete(sub)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la subcategoría porque tiene tickets asociados.",
        )
    return {"ok": True}
