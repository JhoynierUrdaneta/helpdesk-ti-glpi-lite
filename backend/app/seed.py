from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from .models import (
    User,
    Sede,
    Categoria,
    Subcategoria,
    Ticket,
    TicketHistorial,
    ActivityLog,
)
from .auth import hash_password


def run_seed(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    # 1. Usuarios iniciales del Área de TI
    admin = User(
        nombre="Coordinador TI (Admin)",
        usuario="admin",
        password_hash=hash_password("admin123"),
        rol="ADMIN",
        activo=True,
        must_change_password=False,
    )
    tech1 = User(
        nombre="Carlos Mendoza — Soporte Nivel 2",
        usuario="cmendoza",
        password_hash=hash_password("cmendoza123"),
        rol="USER",
        activo=True,
        must_change_password=False,
    )
    tech2 = User(
        nombre="Laura Gómez — Infraestructura y Redes",
        usuario="lgomez",
        password_hash=hash_password("lgomez"),  # Igual al usuario para probar flujo de cambio inicial
        rol="USER",
        activo=True,
        must_change_password=True,
    )
    db.add_all([admin, tech1, tech2])
    db.flush()

    # 2. Sedes
    sedes = [
        Sede(nombre="Sede Principal — Bogotá"),
        Sede(nombre="Sede Norte — Medellín"),
        Sede(nombre="Sede Occidente — Cali"),
        Sede(nombre="Data Center Central"),
    ]
    db.add_all(sedes)
    db.flush()

    # 3. Categorías y Subcategorías vinculadas
    cat_redes = Categoria(nombre="Redes y Conectividad")
    cat_hw = Categoria(nombre="Hardware y Equipos")
    cat_sw = Categoria(nombre="Sistemas y Accesos")
    db.add_all([cat_redes, cat_hw, cat_sw])
    db.flush()

    sub_vpn = Subcategoria(nombre="Falla de Túnel VPN / Firewall", categoria_id=cat_redes.id)
    sub_wifi = Subcategoria(nombre="Caída de Red LAN / Wi-Fi", categoria_id=cat_redes.id)
    sub_switch = Subcategoria(nombre="Switch / Patch Panel", categoria_id=cat_redes.id)

    sub_pc = Subcategoria(nombre="Mantenimiento / Falla de Portátil", categoria_id=cat_hw.id)
    sub_imp = Subcategoria(nombre="Impresoras y Periféricos", categoria_id=cat_hw.id)
    sub_srv = Subcategoria(nombre="Servidor Físico / Almacenamiento", categoria_id=cat_hw.id)

    sub_ad = Subcategoria(nombre="Directorio Activo / Credenciales", categoria_id=cat_sw.id)
    sub_erp = Subcategoria(nombre="ERP / Base de Datos", categoria_id=cat_sw.id)
    sub_correo = Subcategoria(nombre="Correo Corporativo / Microsoft 365", categoria_id=cat_sw.id)

    db.add_all([sub_vpn, sub_wifi, sub_switch, sub_pc, sub_imp, sub_srv, sub_ad, sub_erp, sub_correo])
    db.flush()

    # 4. Tickets de ejemplo estilo GLPI ligero
    now = datetime.utcnow()
    t1 = Ticket(
        fecha_creacion=now - timedelta(hours=28),
        fecha_compromiso=date.today(),
        fecha_cierre=now - timedelta(hours=22),
        sede_id=sedes[0].id,
        categoria_id=cat_redes.id,
        subcategoria_id=sub_vpn.id,
        creador_id=tech1.id,
        responsable_id=tech1.id,
        prioridad="Alta",
        impacto="Alto",
        estado="Cerrado",
        descripcion="Pérdida de enlace IPSec entre Sede Principal y Data Center Central tras corte eléctrico.",
        observaciones="Se reinició interfaz WAN2 en FortiGate y se verificó levantamiento de túneles.",
        evidencia_url="/uploads/tickets/ticket_1794079767.jpg",
    )
    t2 = Ticket(
        fecha_creacion=now - timedelta(hours=5),
        fecha_compromiso=date.today() + timedelta(days=1),
        sede_id=sedes[1].id,
        categoria_id=cat_hw.id,
        subcategoria_id=sub_srv.id,
        creador_id=admin.id,
        responsable_id=tech1.id,
        prioridad="Crítica",
        impacto="Crítica",
        estado="En Proceso",
        descripcion="Alerta de degradación en arreglo RAID-10 del nodo de virtualización Proxmox PVE-02.",
        observaciones="Disco SAS bahía 3 en estado predictivo. Reemplazo en ventana programada.",
    )
    t3 = Ticket(
        fecha_creacion=now - timedelta(hours=2),
        fecha_compromiso=date.today() + timedelta(days=2),
        sede_id=sedes[2].id,
        categoria_id=cat_sw.id,
        subcategoria_id=sub_ad.id,
        creador_id=tech1.id,
        responsable_id=admin.id,
        prioridad="Media",
        impacto="Medio",
        estado="Abierto",
        descripcion="Sincronización pendiente de políticas GPO para equipos nuevos del área contable.",
    )
    db.add_all([t1, t2, t3])
    db.flush()

    db.add_all(
        [
            TicketHistorial(
                ticket_id=t1.id,
                usuario_id=tech1.id,
                estado_anterior=None,
                estado_nuevo="Abierto",
                comentario="Incidente reportado por monitoreo Zabbix.",
                fecha=now - timedelta(hours=28),
            ),
            TicketHistorial(
                ticket_id=t1.id,
                usuario_id=tech1.id,
                estado_anterior="Abierto",
                estado_nuevo="Cerrado",
                comentario="Se reinició interfaz WAN2 en FortiGate y se verificó estabilidad del enlace.",
                adjunto_url="/uploads/tickets/ticket_1794079767.jpg",
                fecha=now - timedelta(hours=22),
            ),
            TicketHistorial(
                ticket_id=t2.id,
                usuario_id=admin.id,
                estado_anterior=None,
                estado_nuevo="En Proceso",
                comentario="Asignado a soporte nivel 2 para verificación física en rack.",
                fecha=now - timedelta(hours=5),
            ),
            TicketHistorial(
                ticket_id=t3.id,
                usuario_id=tech1.id,
                estado_anterior=None,
                estado_nuevo="Abierto",
                comentario="Ticket abierto en bandeja TI.",
                fecha=now - timedelta(hours=2),
            ),
        ]
    )

    # 5. Registros iniciales de Informe Mensual de Actividades (para mes actual)
    today = date.today()
    periodo = today.strftime("%Y-%m")
    first_day = today.replace(day=1)
    second_day = today.replace(day=min(today.day, 2))
    eighth_day = today.replace(day=8)

    db.add_all(
        [
            ActivityLog(
                usuario_id=admin.id,
                fecha_registro=first_day,
                periodo_mes=periodo,
                semana=1,
                actividad="Verificación preventiva de switches core y respaldos de configuración en FortiGate.",
                evidencia_foto_url="/uploads/tickets/ticket_1794079767.jpg",
                entregable="Backup de configuración almacenado en repositorio de TI.",
            ),
            ActivityLog(
                usuario_id=admin.id,
                fecha_registro=second_day,
                periodo_mes=periodo,
                semana=1,
                actividad="Auditoría de cuentas activas y depuración de permisos en Directorio Activo.",
                evidencia_foto_url="/uploads/tickets/ticket_1794080312.jpg",
                entregable="Matriz de accesos depurada y firmada.",
            ),
            ActivityLog(
                usuario_id=admin.id,
                fecha_registro=eighth_day,
                periodo_mes=periodo,
                semana=2,
                actividad="Mantenimiento de gabinete de telecomunicaciones y peinado de patch cords Sede Principal.",
                evidencia_foto_url="/uploads/tickets/ticket_1794351289.jpeg",
                entregable="Rack certificado y etiquetado.",
            ),
            ActivityLog(
                usuario_id=tech1.id,
                fecha_registro=first_day,
                periodo_mes=periodo,
                semana=1,
                actividad="Alistamiento e instalación de imagen corporativa en 4 equipos portátiles de nuevos ingresos.",
                evidencia_foto_url="/uploads/tickets/ticket_1794079767.jpg",
                entregable="4 actas de entrega de equipo firmadas.",
            ),
        ]
    )

    db.commit()
