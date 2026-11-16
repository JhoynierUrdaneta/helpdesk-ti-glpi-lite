import io
from pathlib import Path
from typing import Dict, List
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from fpdf import FPDF
from PIL import Image

from .config import settings
from .models import ActivityLog

MESES_ES = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
}


def format_periodo_mes(periodo_mes: str) -> str:
    try:
        year, month = periodo_mes.split("-")
        return f"{MESES_ES.get(month, month)} {year}"
    except Exception:
        return periodo_mes


def resolve_local_image_path(evidencia_foto_url: str | None) -> Path | None:
    if not evidencia_foto_url:
        return None
    clean_rel = evidencia_foto_url.lstrip("/")
    if clean_rel.startswith("uploads/"):
        clean_rel = clean_rel[len("uploads/") :]
    full_path = settings.UPLOAD_DIR / clean_rel
    if full_path.exists() and full_path.is_file():
        return full_path
    return None


def generate_monthly_docx(
    nombre_completo: str,
    periodo_mes: str,
    grouped_weeks: Dict[int, List[ActivityLog]],
) -> bytes:
    doc = Document()

    # Configurar márgenes limpios
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.7)
        section.right_margin = Inches(0.7)

    # Título Editorial
    title = doc.add_paragraph()
    title_run = title.add_run("INFORME MENSUAL DE ACTIVIDADES — ÁREA TI")
    title_run.bold = True
    title_run.font.size = Pt(14)
    title_run.font.color.rgb = RGBColor(0x11, 0x11, 0x11)

    # Metadatos requeridos por formato
    p_nombre = doc.add_paragraph()
    r1 = p_nombre.add_run("Nombre Completo: ")
    r1.bold = True
    p_nombre.add_run(nombre_completo)

    p_mes = doc.add_paragraph()
    r2 = p_mes.add_run("Mes de Elaboración: ")
    r2.bold = True
    p_mes.add_run(format_periodo_mes(periodo_mes))

    # Tabla: Semana | Actividad | Evidencia | Entregable
    table = doc.add_table(rows=1, cols=4)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ["Semana", "Actividad", "Evidencia", "Entregable"]
    hdr_cells = table.rows[0].cells
    for idx, text in enumerate(headers):
        hdr_cells[idx].text = text
        for paragraph in hdr_cells[idx].paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.size = Pt(10)

    for semana_num in (1, 2, 3, 4):
        items = grouped_weeks.get(semana_num, [])
        # Si aún no hay registros en esa semana, dejar al menos 1 fila en blanco como en la plantilla
        rows_to_render = items if items else [None]
        first_cell_of_week = None

        for idx, item in enumerate(rows_to_render):
            row_cells = table.add_row().cells
            for c in row_cells:
                c.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

            if idx == 0:
                row_cells[0].text = f"Semana {semana_num}"
                for p in row_cells[0].paragraphs:
                    for r in p.runs:
                        r.bold = True
                        r.font.size = Pt(9.5)
                first_cell_of_week = row_cells[0]
            else:
                # Combinar verticalmente la columna "Semana X"
                if first_cell_of_week is not None:
                    first_cell_of_week.merge(row_cells[0])

            if item is not None:
                # Actividad (con fecha discreta)
                fecha_str = item.fecha_registro.strftime("%Y-%m-%d")
                row_cells[1].text = f"[{fecha_str}] {item.actividad}"
                for p in row_cells[1].paragraphs:
                    for r in p.runs:
                        r.font.size = Pt(9.5)

                # Evidencia (foto incrustada si existe)
                img_path = resolve_local_image_path(item.evidencia_foto_url)
                if img_path:
                    try:
                        # Convertir a PNG/RGB en memoria por si es WEBP
                        with Image.open(img_path) as im:
                            im.thumbnail((800, 800))
                            im_rgb = im.convert("RGB")
                            img_buf = io.BytesIO()
                            im_rgb.save(img_buf, format="JPEG", quality=85)
                            img_buf.seek(0)
                        p_img = row_cells[2].paragraphs[0]
                        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        run_img = p_img.add_run()
                        run_img.add_picture(img_buf, width=Inches(1.45))
                    except Exception:
                        row_cells[2].text = "Imagen adjunta"
                else:
                    row_cells[2].text = "Sin foto"

                # Entregable
                row_cells[3].text = item.entregable
                for p in row_cells[3].paragraphs:
                    for r in p.runs:
                        r.font.size = Pt(9.5)

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


def _clean_latin1(text: str) -> str:
    return text.encode("latin-1", "replace").decode("latin-1")


def generate_monthly_pdf(
    nombre_completo: str,
    periodo_mes: str,
    grouped_weeks: Dict[int, List[ActivityLog]],
) -> bytes:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Encabezado
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 17, 17)
    pdf.cell(0, 8, _clean_latin1("INFORME MENSUAL DE ACTIVIDADES - AREA TI"), ln=True)
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(38, 6, _clean_latin1("Nombre Completo:"), border=0)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _clean_latin1(nombre_completo), ln=True)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(38, 6, _clean_latin1("Mes de Elaboración:"), border=0)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _clean_latin1(format_periodo_mes(periodo_mes)), ln=True)
    pdf.ln(4)

    # Anchos de columna (Total 190mm en A4 con márgenes de 10mm)
    col_w = [26, 66, 46, 52]

    def draw_table_header():
        pdf.set_fill_color(247, 246, 243)
        pdf.set_draw_color(210, 210, 210)
        pdf.set_font("Helvetica", "B", 9.5)
        headers = ["Semana", "Actividad", "Evidencia", "Entregable"]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 8, _clean_latin1(h), border=1, fill=True, align="C")
        pdf.ln()

    draw_table_header()
    pdf.set_font("Helvetica", "", 8.5)

    for semana_num in (1, 2, 3, 4):
        items = grouped_weeks.get(semana_num, [])
        rows_to_render = items if items else [None]

        for idx, item in enumerate(rows_to_render):
            img_path = resolve_local_image_path(item.evidencia_foto_url) if item else None
            row_h = 30 if img_path else 14

            if pdf.get_y() + row_h > 275:
                pdf.add_page()
                draw_table_header()
                pdf.set_font("Helvetica", "", 8.5)

            x_start = pdf.get_x()
            y_start = pdf.get_y()

            # Dibujar los bordes de las 4 celdas de la fila
            for i, w in enumerate(col_w):
                pdf.rect(x_start + sum(col_w[:i]), y_start, w, row_h)

            # Columna 0: Semana (se muestra en la primera fila de la semana o tras salto)
            if idx == 0:
                pdf.set_xy(x_start + 1, y_start + 2)
                pdf.set_font("Helvetica", "B", 9)
                pdf.multi_cell(col_w[0] - 2, 5, _clean_latin1(f"Semana {semana_num}"))
                pdf.set_font("Helvetica", "", 8.5)

            if item is not None:
                # Columna 1: Actividad
                fecha_str = item.fecha_registro.strftime("%Y-%m-%d")
                act_text = f"[{fecha_str}] {item.actividad}"
                pdf.set_xy(x_start + col_w[0] + 1.5, y_start + 2)
                pdf.multi_cell(col_w[1] - 3, 4.2, _clean_latin1(act_text[:260]))

                # Columna 2: Evidencia (Imagen)
                if img_path:
                    try:
                        with Image.open(img_path) as im:
                            im.thumbnail((800, 800))
                            im_rgb = im.convert("RGB")
                            img_buf = io.BytesIO()
                            im_rgb.save(img_buf, format="JPEG", quality=85)
                            img_buf.seek(0)
                        pdf.image(
                            img_buf,
                            x=x_start + col_w[0] + col_w[1] + 5,
                            y=y_start + 2,
                            w=col_w[2] - 10,
                            h=row_h - 4,
                        )
                    except Exception:
                        pdf.set_xy(x_start + col_w[0] + col_w[1] + 2, y_start + 2)
                        pdf.multi_cell(col_w[2] - 4, 4.2, "Foto adjunta")
                else:
                    pdf.set_xy(x_start + col_w[0] + col_w[1] + 2, y_start + 2)
                    pdf.multi_cell(col_w[2] - 4, 4.2, "Sin foto")

                # Columna 3: Entregable
                pdf.set_xy(x_start + col_w[0] + col_w[1] + col_w[2] + 1.5, y_start + 2)
                pdf.multi_cell(col_w[3] - 3, 4.2, _clean_latin1(item.entregable[:220]))

            pdf.set_xy(x_start, y_start + row_h)

    return bytes(pdf.output())
