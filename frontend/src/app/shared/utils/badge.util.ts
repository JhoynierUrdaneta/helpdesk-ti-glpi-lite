export function getStatusBadgeClass(estado: string): string {
  switch (estado) {
    case 'Abierto':
      return 'badge-pill badge-blue';
    case 'En Proceso':
    case 'Pendiente Ext':
      return 'badge-pill badge-yellow';
    case 'Resuelto':
    case 'Cerrado':
      return 'badge-pill badge-green';
    case 'Escalado':
      return 'badge-pill badge-red';
    default:
      return 'badge-pill badge-neutral';
  }
}

export function getPriorityBadgeClass(prioridad: string): string {
  switch (prioridad) {
    case 'Crítica':
    case 'Alta':
      return 'badge-pill badge-red';
    case 'Media':
      return 'badge-pill badge-yellow';
    default:
      return 'badge-pill badge-neutral';
  }
}
