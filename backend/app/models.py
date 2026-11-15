from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Date,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    usuario = Column(String(60), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="USER")  # ADMIN | USER
    activo = Column(Boolean, default=True, nullable=False)
    must_change_password = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String(64), index=True, nullable=False)
    usuario = Column(String(60), index=True, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)


class LoginLog(Base):
    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    nombre = Column(String(120), nullable=False)
    usuario = Column(String(60), nullable=False)
    ip = Column(String(64), nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)


class Sede(Base):
    __tablename__ = "sedes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    subcategorias = relationship(
        "Subcategoria", back_populates="categoria", cascade="all, delete-orphan"
    )


class Subcategoria(Base):
    __tablename__ = "subcategorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    categoria_id = Column(
        Integer, ForeignKey("categorias.id", ondelete="CASCADE"), nullable=False
    )
    categoria = relationship("Categoria", back_populates="subcategorias")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_compromiso = Column(Date, nullable=True)
    fecha_cierre = Column(DateTime, nullable=True)

    sede_id = Column(Integer, ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False)
    categoria_id = Column(
        Integer, ForeignKey("categorias.id", ondelete="RESTRICT"), nullable=False
    )
    subcategoria_id = Column(
        Integer, ForeignKey("subcategorias.id", ondelete="RESTRICT"), nullable=False
    )

    creador_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    responsable_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    prioridad = Column(String(30), nullable=False)  # Baja | Media | Alta | Crítica
    impacto = Column(String(30), nullable=False)  # Bajo | Medio | Alto | Crítico
    tipo = Column(String(30), default="Incidente", nullable=False)  # Incidente | Requerimiento
    estado = Column(
        String(30), default="Abierto", nullable=False
    )  # Abierto | En Proceso | Pendiente Ext | Escalado | Resuelto | Cerrado | Cancelado

    descripcion = Column(Text, nullable=False)
    observaciones = Column(Text, nullable=True)
    solucion = Column(Text, nullable=True)
    calificacion = Column(Integer, nullable=True)  # 1..5 estrellas al aprobar cierre
    veces_reabierto = Column(Integer, default=0, nullable=False)
    evidencia_url = Column(String(255), nullable=True)

    sede_rel = relationship("Sede")
    categoria_rel = relationship("Categoria")
    subcategoria_rel = relationship("Subcategoria")
    creador_rel = relationship("User", foreign_keys=[creador_id])
    responsable_rel = relationship("User", foreign_keys=[responsable_id])
    historial = relationship(
        "TicketHistorial",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketHistorial.fecha.asc()",
    )


class TicketHistorial(Base):
    __tablename__ = "ticket_historial"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(
        Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id = Column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    estado_anterior = Column(String(30), nullable=True)
    estado_nuevo = Column(String(30), nullable=False)
    comentario = Column(Text, nullable=False)
    es_privado = Column(Boolean, default=False, nullable=False)
    adjunto_url = Column(String(255), nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("Ticket", back_populates="historial")
    usuario_rel = relationship("User")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fecha_registro = Column(Date, nullable=False)
    periodo_mes = Column(String(7), nullable=False, index=True)  # YYYY-MM
    semana = Column(Integer, nullable=False)  # 1 | 2 | 3 | 4
    actividad = Column(Text, nullable=False)
    evidencia_foto_url = Column(String(255), nullable=True)
    entregable = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario_rel = relationship("User")
