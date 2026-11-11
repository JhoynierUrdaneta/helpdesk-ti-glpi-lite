from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


# --- AUTH & USERS ---
class LoginRequest(BaseModel):
    usuario: str
    password: str
    turnstile_token: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    nombre: str
    usuario: str
    rol: str
    activo: bool
    must_change_password: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool
    user: UserOut


class UserCreate(BaseModel):
    nombre: str = Field(..., min_length=2)
    usuario: str = Field(..., min_length=2)
    rol: str = "USER"


class UserUpdate(BaseModel):
    nombre: str = Field(..., min_length=2)
    usuario: str = Field(..., min_length=2)
    rol: str
    activo: bool
    reset_password: bool = False


# --- CATALOGS ---
class SedeOut(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class SubcategoriaOut(BaseModel):
    id: int
    nombre: str
    categoria_id: int

    class Config:
        from_attributes = True


class CategoriaOut(BaseModel):
    id: int
    nombre: str
    subcategorias: List[SubcategoriaOut] = []

    class Config:
        from_attributes = True


class CatalogItemCreate(BaseModel):
    nombre: str = Field(..., min_length=2)
    categoria_id: Optional[int] = None


# --- TICKETS ---
class TicketHistorialOut(BaseModel):
    id: int
    ticket_id: int
    usuario_id: int
    usuario_nombre: str
    estado_anterior: Optional[str] = None
    estado_nuevo: str
    comentario: str
    adjunto_url: Optional[str] = None
    fecha: datetime


class TicketOut(BaseModel):
    id: int
    fecha_creacion: datetime
    fecha_compromiso: Optional[date] = None
    fecha_cierre: Optional[datetime] = None
    sede_id: int
    sede_nombre: str
    categoria_id: int
    categoria_nombre: str
    subcategoria_id: int
    subcategoria_nombre: str
    creador_id: int
    creador_nombre: str
    responsable_id: int
    responsable_nombre: str
    prioridad: str
    impacto: str
    estado: str
    descripcion: str
    observaciones: Optional[str] = None
    evidencia_url: Optional[str] = None
    esta_bloqueado: bool
    historial: List[TicketHistorialOut] = []


class DashboardStatsOut(BaseModel):
    total: int
    pendientes: int
    cerrados: int
    promedio_horas_sla: Optional[float] = None
    por_estado: List[dict]
    ultimos_7_dias: List[dict]


# --- ACTIVITY LOGS (INFORME MENSUAL) ---
class ActivityLogOut(BaseModel):
    id: int
    usuario_id: int
    usuario_nombre: str
    fecha_registro: date
    periodo_mes: str
    semana: int
    actividad: str
    evidencia_foto_url: Optional[str] = None
    entregable: str
    created_at: datetime

    class Config:
        from_attributes = True


class MonthlyReportOut(BaseModel):
    usuario_id: int
    nombre_completo: str
    periodo_mes: str
    mes_legible: str
    total_actividades: int
    semanas: dict  # {"1": [ActivityLogOut, ...], "2": [...], "3": [...], "4": [...]}
