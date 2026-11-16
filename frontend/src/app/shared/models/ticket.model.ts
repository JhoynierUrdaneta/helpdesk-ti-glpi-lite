export interface TicketHistorial {
  id: number;
  ticket_id: number;
  usuario_id: number;
  usuario_nombre: string;
  estado_anterior?: string;
  estado_nuevo: string;
  comentario: string;
  es_privado?: boolean;
  adjunto_url?: string;
  fecha: string;
}

export interface Ticket {
  id: number;
  fecha_creacion: string;
  fecha_compromiso?: string;
  fecha_cierre?: string;
  sede_id: number;
  sede_nombre: string;
  categoria_id: number;
  categoria_nombre: string;
  subcategoria_id: number;
  subcategoria_nombre: string;
  creador_id: number;
  creador_nombre: string;
  responsable_id?: number | null;
  responsable_nombre: string;
  prioridad: string;
  impacto: string;
  tipo: string;
  estado: string;
  descripcion: string;
  observaciones?: string;
  solucion?: string;
  calificacion?: number;
  veces_reabierto: number;
  evidencia_url?: string;
  esta_bloqueado: boolean;
  historial: TicketHistorial[];
}

export interface DashboardStats {
  total: number;
  pendientes: number;
  cerrados: number;
  promedio_horas_sla: number | null;
  por_estado: { estado: string; cantidad: number }[];
  ultimos_7_dias: { dia: string; total: number }[];
}
