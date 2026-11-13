from datetime import date
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    Response,
)
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ActivityLog, User
from ..schemas import ActivityLogOut, MonthlyReportOut
from ..auth import get_active_verified_user, save_validated_upload
from ..exporters import (
    generate_monthly_docx,
    generate_monthly_pdf,
    format_periodo_mes,
)

router = APIRouter(prefix="/api/activities", tags=["Informe Mensual de Actividades"])


def compute_week_of_month(d: date) -> int:
    """Clasifica el día del mes en Semana 1 (1-7), Semana 2 (8-14), Semana 3 (15-21) o Semana 4 (22+)."""
    if d.day <= 7:
        return 1
    elif d.day <= 14:
        return 2
    elif d.day <= 21:
        return 3
    return 4


def serialize_activity(a: ActivityLog) -> ActivityLogOut:
    return ActivityLogOut(
        id=a.id,
        usuario_id=a.usuario_id,
        usuario_nombre=a.usuario_rel.nombre if a.usuario_rel else "",
        fecha_registro=a.fecha_registro,
        periodo_mes=a.periodo_mes,
        semana=a.semana,
        actividad=a.actividad,
        evidencia_foto_url=a.evidencia_foto_url,
        entregable=a.entregable,
        created_at=a.created_at,
    )


def _resolve_target_user(
    db: Session, current_user: User, target_user_id: Optional[int]
) -> User:
    if target_user_id and target_user_id != current_user.id:
        if current_user.rol != "ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Solo un administrador puede consultar informes de otros usuarios.",
            )
        u = db.query(User).filter(User.id == target_user_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        return u
    return current_user


@router.get("/monthly", response_model=MonthlyReportOut)
def get_monthly_report(
    month: Optional[str] = Query(None, description="Formato YYYY-MM"),
    user_id: Optional[int] = Query(None, description="ID de usuario (solo ADMIN)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    target_user = _resolve_target_user(db, current_user, user_id)
    periodo = month if month else date.today().strftime("%Y-%m")

    logs = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.usuario_id == target_user.id,
            ActivityLog.periodo_mes == periodo,
        )
        .order_by(
            ActivityLog.semana.asc(),
            ActivityLog.fecha_registro.asc(),
            ActivityLog.id.asc(),
        )
        .all()
    )

    semanas = {"1": [], "2": [], "3": [], "4": []}
    for log in logs:
        key = str(min(max(log.semana, 1), 4))
        semanas[key].append(serialize_activity(log))

    return MonthlyReportOut(
        usuario_id=target_user.id,
        nombre_completo=target_user.nombre,
        periodo_mes=periodo,
        mes_legible=format_periodo_mes(periodo),
        total_actividades=len(logs),
        semanas=semanas,
    )


@router.post("", response_model=ActivityLogOut)
async def create_daily_activity(
    actividad: str = Form(...),
    entregable: str = Form(...),
    fecha_registro: Optional[date] = Form(None),
    semana: Optional[int] = Form(None),
    evidencia_foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    fecha = fecha_registro if fecha_registro else date.today()
    periodo_mes = fecha.strftime("%Y-%m")
    semana_calc = (
        semana if (semana and 1 <= semana <= 4) else compute_week_of_month(fecha)
    )

    foto_url = await save_validated_upload(
        evidencia_foto, subfolder="activities", images_only=True
    )

    entry = ActivityLog(
        usuario_id=current_user.id,
        fecha_registro=fecha,
        periodo_mes=periodo_mes,
        semana=semana_calc,
        actividad=actividad.strip(),
        evidencia_foto_url=foto_url,
        entregable=entregable.strip(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return serialize_activity(entry)


@router.put("/{activity_id}", response_model=ActivityLogOut)
async def update_daily_activity(
    activity_id: int,
    actividad: str = Form(...),
    entregable: str = Form(...),
    fecha_registro: Optional[date] = Form(None),
    semana: Optional[int] = Form(None),
    evidencia_foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    entry = db.query(ActivityLog).filter(ActivityLog.id == activity_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Registro de actividad no encontrado.")

    if entry.usuario_id != current_user.id and current_user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="No autorizado para editar esta actividad.")

    if fecha_registro:
        entry.fecha_registro = fecha_registro
        entry.periodo_mes = fecha_registro.strftime("%Y-%m")
    if semana and 1 <= semana <= 4:
        entry.semana = semana
    elif fecha_registro:
        entry.semana = compute_week_of_month(fecha_registro)

    entry.actividad = actividad.strip()
    entry.entregable = entregable.strip()

    if evidencia_foto and evidencia_foto.filename:
        foto_url = await save_validated_upload(
            evidencia_foto, subfolder="activities", images_only=True
        )
        entry.evidencia_foto_url = foto_url

    db.commit()
    db.refresh(entry)
    return serialize_activity(entry)


@router.delete("/{activity_id}")
def delete_daily_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    entry = db.query(ActivityLog).filter(ActivityLog.id == activity_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Actividad no encontrada.")
    if entry.usuario_id != current_user.id and current_user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="No autorizado.")

    db.delete(entry)
    db.commit()
    return {"ok": True}


@router.get("/export/docx")
def export_monthly_docx(
    month: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    target_user = _resolve_target_user(db, current_user, user_id)
    periodo = month if month else date.today().strftime("%Y-%m")

    logs = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.usuario_id == target_user.id,
            ActivityLog.periodo_mes == periodo,
        )
        .order_by(ActivityLog.semana.asc(), ActivityLog.fecha_registro.asc())
        .all()
    )

    grouped = {1: [], 2: [], 3: [], 4: []}
    for log in logs:
        grouped[min(max(log.semana, 1), 4)].append(log)

    docx_bytes = generate_monthly_docx(target_user.nombre, periodo, grouped)
    safe_user = target_user.usuario.replace(" ", "_")
    filename = f"Informe_Actividades_{safe_user}_{periodo}.docx"

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/pdf")
def export_monthly_pdf(
    month: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_verified_user),
):
    target_user = _resolve_target_user(db, current_user, user_id)
    periodo = month if month else date.today().strftime("%Y-%m")

    logs = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.usuario_id == target_user.id,
            ActivityLog.periodo_mes == periodo,
        )
        .order_by(ActivityLog.semana.asc(), ActivityLog.fecha_registro.asc())
        .all()
    )

    grouped = {1: [], 2: [], 3: [], 4: []}
    for log in logs:
        grouped[min(max(log.semana, 1), 4)].append(log)

    pdf_bytes = generate_monthly_pdf(target_user.nombre, periodo, grouped)
    safe_user = target_user.usuario.replace(" ", "_")
    filename = f"Informe_Actividades_{safe_user}_{periodo}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
