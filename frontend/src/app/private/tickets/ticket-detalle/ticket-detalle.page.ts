import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketsService } from '../../../shared/services/tickets.service';
import { UsersService } from '../../../shared/services/users.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Ticket } from '../../../shared/models/ticket.model';
import { User } from '../../../shared/models/user.model';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../../shared/utils/badge.util';
import { ESTADOS } from '../tickets-list/tickets-list.page';

@Component({
  selector: 'app-ticket-detalle-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ticket-detalle.page.html',
  styleUrl: './ticket-detalle.page.css'
})
export class TicketDetallePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketsService = inject(TicketsService);
  private usersService = inject(UsersService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  ticket: Ticket | null = null;
  technicians: User[] = [];

  estado = '';
  responsableId = 0;
  fechaCompromiso = '';
  solucion = '';
  comentario = '';
  esPrivado = false;
  selectedFile: File | null = null;
  saving = false;

  rating = 5;
  approveNote = '';
  reopenMotivo = '';
  showReopenBox = false;

  estados = ESTADOS;
  statusBadge = getStatusBadgeClass;
  priorityBadge = getPriorityBadgeClass;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.usersService.getTechnicians().subscribe((res) => (this.technicians = res));
    this.ticketsService.getTicketById(id).subscribe((res) => this.setTicket(res));
  }

  private setTicket(t: Ticket): void {
    this.ticket = t;
    this.estado = t.estado;
    this.responsableId = t.responsable_id;
    this.fechaCompromiso = t.fecha_compromiso || '';
    this.solucion = t.solucion || '';
    this.showReopenBox = false;
    this.reopenMotivo = '';
  }

  canValidateOrReopen(): boolean {
    const u = this.auth.getCurrentUser();
    if (!u || !this.ticket) return false;
    return u.rol === 'ADMIN' || u.id === this.ticket.creador_id || u.id === this.ticket.responsable_id;
  }

  onFileSelected(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  submitFollowup(): void {
    if (!this.ticket || !this.comentario.trim()) {
      this.toast.show('Escriba un comentario de seguimiento', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('estado', this.estado);
    fd.append('observaciones', this.comentario.trim());
    fd.append('es_privado', String(this.esPrivado));
    if (this.solucion.trim()) fd.append('solucion', this.solucion.trim());
    if (this.responsableId) fd.append('responsable_id', String(this.responsableId));
    if (this.fechaCompromiso) fd.append('fecha_compromiso', this.fechaCompromiso);
    if (this.selectedFile) fd.append('evidencia', this.selectedFile);

    this.saving = true;
    this.ticketsService.manageTicket(this.ticket.id, fd).subscribe({
      next: (updated) => {
        this.saving = false;
        this.setTicket(updated);
        this.comentario = '';
        this.esPrivado = false;
        this.selectedFile = null;
        this.toast.show('Seguimiento registrado');
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'Error al actualizar ticket', 'error');
      },
    });
  }

  approve(): void {
    if (!this.ticket) return;
    this.saving = true;
    this.ticketsService.approveTicket(this.ticket.id, this.rating, this.approveNote).subscribe({
      next: (updated) => {
        this.saving = false;
        this.setTicket(updated);
        this.toast.show('Solución aprobada y ticket cerrado');
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'No se pudo aprobar el cierre', 'error');
      },
    });
  }

  reopen(): void {
    if (!this.ticket || this.reopenMotivo.trim().length < 4) {
      this.toast.show('Escribe el motivo para reabrir el ticket (mín. 4 caracteres)', 'error');
      return;
    }
    this.saving = true;
    this.ticketsService.reopenTicket(this.ticket.id, this.reopenMotivo.trim()).subscribe({
      next: (updated) => {
        this.saving = false;
        this.setTicket(updated);
        this.toast.show('Ticket reabierto y devuelto a En Proceso');
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'No se pudo reabrir el ticket', 'error');
      },
    });
  }
}
