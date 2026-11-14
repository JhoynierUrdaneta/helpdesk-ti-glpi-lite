export interface ActivityLog {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  fecha_registro: string;
  periodo_mes: string;
  semana: number;
  actividad: string;
  evidencia_foto_url?: string;
  entregable: string;
  created_at: string;
}

export interface MonthlyReport {
  usuario_id: number;
  nombre_completo: string;
  periodo_mes: string;
  mes_legible: string;
  total_actividades: number;
  semanas: { [key: string]: ActivityLog[] };
}
