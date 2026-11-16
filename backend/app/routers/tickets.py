from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..database import get_db
from ..models import Ticket, TicketHistorial, User, Sede, Categoria, Subcategoria
from ..schemas import (
    TicketOut,
    TicketHistorialOut,
    DashboardStatsOut,
    ReopenTicketRequest,
    ApproveTicketRequest,
)
from ..auth import get_active_verified_user, save_validated_upload

router = APIRouter(prefix="/api/tickets", tags=["Tickets TI"])

LOCKED_STATES = {"Cerrado", "Cancelado"}
ALLOWED_TICKET_STATES = {"Abierto", "En Proceso", "Pendiente Ext", "Escalado", "Resuelto", "Cerrado", "Cancelado"}


def serialize_ticket(t: Ticket, current_user: Optional[User] = None) -> TicketOut:
    can_see_private = bool(
        current_user
        and (current_user.rol == "ADMIN" or current_user.id == t.responsable_id)
    )
    visible_history = [
        h for h in (t.historial or []) if not h.es_privado or can_see_private
    ]
    return TicketOut(
        id=t.id,
        fecha_creacion=t.fecha_creacion,
        fecha_compromiso=t.fecha_compromiso,
        fecha_cierre=t.fecha_cierre,
        sede_id=t.sede_id,
        sede_nombre=t.sede_rel.nombre if t.sede_rel else "",
        categoria_id=t.categoria_id,
        categoria_nombre=t.categoria_rel.nombre if t.categoria_rel else "",
        subcategoria_id=t.subcategoria_id,
        subcategoria_nombre=t.subcategoria_rel.nombre if t.subcategoria_rel else "",
        creador_id=t.creador_id,
        creador_nombre=t.creador_rel.nombre if t.creador_rel else "",
        responsable_id=t.responsable_id,
        responsable_nombre=t.responsable_rel.nombre if t.responsable_rel else "Sin asignar",
        prioridad=t.prioridad,
        impacto=t.impacto,
        tipo=t.tipo or "Incidente",
        estado=t.estado,
        descripcion=t.descripcion,
        observaciones=t.observaciones,
        solucion=t.solucion,
        calificacion=t.calificacion,
        veces_reabierto=t.veces_reabierto or 0,
        evidencia_url=t.evidencia_url,
        esta_bloqueado=t.estado in LOCKED_STATES,
        historial=[
            TicketHistorialOut(
                id=h.id,
                ticket_id=h.ticket_id,
                usuario_id=h.usuario_id,
                usuario_nombre=h.usuario_rel.nombre if h.usuario_rel else "Sistema",
                estado_anterior=h.estado_anterior,
                estado_nuevo=h.estado_nuevo,
                comentario=h.comentario,
                es_privado=bool(h.es_privado),
                adjunto_url=h.adjunto_url,
                fecha=h.fecha,
            )
            for h in visible_history
        ],
    )


@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    scope: str = Query("auto", description="auto | mine | all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    base_q = db.query(Ticket)
    if current_user.rol != "ADMIN" or scope == "mine":
        base_q = base_q.filter(
            or_(
                Ticket.creador_id == current_user.id,
                Ticket.responsable_id == current_user.id,
            )
        )

    tickets = base_q.all()
    total = len(tickets)
    pendientes = sum(1 for t in tickets if t.estado not in LOCKED_STATES)
    cerrados_list = [t for t in tickets if t.estado == "Cerrado"]
    cerrados = len(cerrados_list)

    horas_list = []
    for t in cerrados_list:
        if t.fecha_cierre and t.fecha_creacion:
            diff_h = (t.fecha_cierre - t.fecha_creacion).total_seconds() / 3600.0
            horas_list.append(max(diff_h, 0.1))

    promedio_sla = round(sum(horas_list) / len(horas_list), 1) if horas_list else None

    # Distribución por estado
    estado_counts = {}
    for t in tickets:
        estado_counts[t.estado] = estado_counts.get(t.estado, 0) + 1
    por_estado = [{"estado": k, "cantidad": v} for k, v in estado_counts.items()]

    # Últimos 7 días
    today = datetime.utcnow().date()
    dias_map = {(today - timedelta(days=i)).isoformat(): 0 for i in range(6, -1, -1)}
    for t in tickets:
        d_str = t.fecha_creacion.date().isoformat()
        if d_str in dias_map:
            dias_map[d_str] += 1
    ultimos_7_dias = [{"dia": k, "total": v} for k, v in dias_map.items()]

    return DashboardStatsOut(
        total=total,
        pendientes=pendientes,
        cerrados=cerrados,
        promedio_horas_sla=promedio_sla,
        por_estado=por_estado,
        ultimos_7_dias=ultimos_7_dias,
    )


@router.get("", response_model=List[TicketOut])
def list_tickets(
    scope: str = Query("auto", description="auto | mine | all"),
    estado: Optional[str] = Query(None),
    prioridad: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    q = db.query(Ticket)

    if scope == "unassigned":
        q = q.filter(Ticket.responsable_id.is_(None))
    elif current_user.rol != "ADMIN":
        if scope == "mine":
            q = q.filter(
                or_(
                    Ticket.creador_id == current_user.id,
                    Ticket.responsable_id == current_user.id,
                )
            )
        else:
            q = q.filter(
                or_(
                    Ticket.creador_id == current_user.id,
                    Ticket.responsable_id == current_user.id,
                    Ticket.responsable_id.is_(None),
                )
            )
    elif scope == "mine":
        q = q.filter(
            or_(
                Ticket.creador_id == current_user.id,
                Ticket.responsable_id == current_user.id,
            )
        )

    if estado:
        q = q.filter(Ticket.estado == estado)
    if prioridad:
        q = q.filter(Ticket.prioridad == prioridad)
    if search:
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                Ticket.descripcion.ilike(term),
                Ticket.observaciones.ilike(term),
            )
        )

    tickets = q.order_by(Ticket.fecha_creacion.desc()).all()
    return [serialize_ticket(t, current_user) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")
    if (
        current_user.rol != "ADMIN"
        and ticket.responsable_id is not None
        and current_user.id not in (ticket.creador_id, ticket.responsable_id)
    ):
        raise HTTPException(
            status_code=403, detail="No tienes permiso para ver este ticket."
        )
    return serialize_ticket(ticket, current_user)


@router.post("", response_model=TicketOut)
async def create_ticket(
    sede_id: int = Form(...),
    categoria_id: int = Form(...),
    subcategoria_id: int = Form(...),
    prioridad: str = Form(...),
    impacto: str = Form(...),
    tipo: str = Form("Incidente"),
    descripcion: str = Form(...),
    observaciones: Optional[str] = Form(None),
    fecha_compromiso: Optional[date] = Form(None),
    responsable_id: Optional[int] = Form(None),
    evidencia: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    evidencia_url = await save_validated_upload(
        evidencia, subfolder="tickets", images_only=False
    )

    assigned_id = responsable_id if responsable_id and responsable_id > 0 else None

    ticket = Ticket(
        fecha_creacion=datetime.utcnow(),
        fecha_compromiso=fecha_compromiso,
        sede_id=sede_id,
        categoria_id=categoria_id,
        subcategoria_id=subcategoria_id,
        creador_id=current_user.id,
        responsable_id=assigned_id,
        prioridad=prioridad,
        impacto=impacto,
        tipo=tipo if tipo in ("Incidente", "Requerimiento") else "Incidente",
        estado="Abierto",
        descripcion=descripcion.strip(),
        observaciones=observaciones.strip() if observaciones else None,
        evidencia_url=evidencia_url,
    )
    db.add(ticket)
    db.flush()

    initial_log = TicketHistorial(
        ticket_id=ticket.id,
        usuario_id=current_user.id,
        estado_anterior=None,
        estado_nuevo="Abierto",
        comentario=observaciones.strip()
        if observaciones and observaciones.strip()
        else "Ticket registrado en la bandeja de soporte TI.",
        adjunto_url=evidencia_url,
        fecha=datetime.utcnow(),
    )
    db.add(initial_log)
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket, current_user)


@router.post("/{ticket_id}/manage", response_model=TicketOut)
async def manage_ticket(
    ticket_id: int,
    estado: str = Form(...),
    observaciones: str = Form(""),
    solucion: Optional[str] = Form(None),
    es_privado: bool = Form(False),
    responsable_id: Optional[int] = Form(None),
    fecha_compromiso: Optional[date] = Form(None),
    evidencia: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")

    if current_user.rol != "ADMIN" and current_user.id != ticket.responsable_id:
        raise HTTPException(
            status_code=403,
            detail="Solo el técnico responsable o un administrador puede gestionar este ticket.",
        )

    if estado not in ALLOWED_TICKET_STATES:
        raise HTTPException(
            status_code=400, detail=f"Estado de ticket inválido: '{estado}'."
        )

    if estado == "Cerrado" and current_user.rol != "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Para cerrar un ticket, márcalo como 'Resuelto' para que el solicitante apruebe la solución.",
        )

    if ticket.estado in LOCKED_STATES:
        raise HTTPException(
            status_code=400,
            detail=f"El ticket #{ticket.id} está {ticket.estado.lower()}. Debe reabrirlo primero si requiere nueva gestión.",
        )

    adjunto_url = await save_validated_upload(
        evidencia, subfolder="tickets", images_only=False
    )

    estado_anterior = ticket.estado
    ticket.estado = estado
    if observaciones.strip():
        ticket.observaciones = observaciones.strip()
    if solucion and solucion.strip():
        ticket.solucion = solucion.strip()
    elif estado == "Resuelto" and observaciones.strip():
        ticket.solucion = observaciones.strip()
    if responsable_id:
        ticket.responsable_id = responsable_id
    if fecha_compromiso:
        ticket.fecha_compromiso = fecha_compromiso

    if estado in LOCKED_STATES:
        ticket.fecha_cierre = datetime.utcnow()

    comentario_bitacora = (
        observaciones.strip()
        if observaciones.strip()
        else f"Actualización de estado a {estado}."
    )

    historial_item = TicketHistorial(
        ticket_id=ticket.id,
        usuario_id=current_user.id,
        estado_anterior=estado_anterior,
        estado_nuevo=estado,
        comentario=comentario_bitacora,
        es_privado=es_privado,
        adjunto_url=adjunto_url,
        fecha=datetime.utcnow(),
    )
    db.add(historial_item)
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket, current_user)


@router.post("/{ticket_id}/approve", response_model=TicketOut)
def approve_solution(
    ticket_id: int,
    payload: ApproveTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")

    if current_user.rol != "ADMIN" and current_user.id != ticket.creador_id:
        raise HTTPException(
            status_code=403,
            detail="Solo el solicitante que creó el ticket o un administrador puede aprobar la solución.",
        )

    if ticket.estado != "Resuelto":
        raise HTTPException(
            status_code=400,
            detail="El ticket debe estar en estado 'Resuelto' para aprobar su cierre.",
        )

    estado_anterior = ticket.estado
    ticket.estado = "Cerrado"
    ticket.calificacion = payload.calificacion
    ticket.fecha_cierre = datetime.utcnow()

    nota = payload.comentario.strip() if payload.comentario and payload.comentario.strip() else "Solución aprobada por el solicitante."
    db.add(
        TicketHistorial(
            ticket_id=ticket.id,
            usuario_id=current_user.id,
            estado_anterior=estado_anterior,
            estado_nuevo="Cerrado",
            comentario=f"{nota} (Calificación: {payload.calificacion}/5 ★)",
            fecha=datetime.utcnow(),
        )
    )
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket, current_user)


@router.post("/{ticket_id}/reopen", response_model=TicketOut)
def reopen_ticket(
    ticket_id: int,
    payload: ReopenTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")

    if (
        current_user.rol != "ADMIN"
        and current_user.id not in (ticket.creador_id, ticket.responsable_id)
    ):
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para reabrir este ticket.",
        )

    if ticket.estado not in (LOCKED_STATES | {"Resuelto"}):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden reabrir tickets resueltos, cerrados o cancelados.",
        )

    estado_anterior = ticket.estado
    ticket.estado = "En Proceso"
    ticket.fecha_cierre = None
    ticket.veces_reabierto = (ticket.veces_reabierto or 0) + 1

    db.add(
        TicketHistorial(
            ticket_id=ticket.id,
            usuario_id=current_user.id,
            estado_anterior=estado_anterior,
            estado_nuevo="En Proceso",
            comentario=f"[Ticket reabierto #{ticket.veces_reabierto}] {payload.motivo.strip()}",
            fecha=datetime.utcnow(),
        )
    )
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket, current_user)


@router.post("/{ticket_id}/claim", response_model=TicketOut)
def claim_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")
    if ticket.estado in LOCKED_STATES:
        raise HTTPException(status_code=400, detail="El ticket ya está finalizado.")
    if ticket.responsable_id is not None:
        raise HTTPException(
            status_code=409,
            detail="Este ticket ya fue asignado o tomado por otro técnico.",
        )

    estado_anterior = ticket.estado
    ticket.responsable_id = current_user.id
    if ticket.estado == "Abierto":
        ticket.estado = "En Proceso"

    db.add(
        TicketHistorial(
            ticket_id=ticket.id,
            usuario_id=current_user.id,
            estado_anterior=estado_anterior,
            estado_nuevo=ticket.estado,
            comentario=f"Ticket tomado de la cola por {current_user.nombre}.",
            fecha=datetime.utcnow(),
        )
    )
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket, current_user)
