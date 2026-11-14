import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { ToastService } from '../../shared/services/toast.service';
import { Ticket } from '../../shared/models/ticket.model';
import { estadoBadgeClass, prioridadBadgeClass } from '../../shared/utils/badge.util';

@Component({
  selector: 'app-ticket-detalle-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6" *ngIf="ticket">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-[#787774]">TICKET #{{ ticket.id }}</span>
            <span [class]="estadoBadge(ticket.estado)">{{ ticket.estado }}</span>
            <span [class]="prioridadBadge(ticket.prioridad)">{{ ticket.prioridad }}</span>
          </div>
          <h2 class="font-serif text-3xl text-[#111111] mt-1">{{ ticket.categoria }} · {{ ticket.sede }}</h2>
        </div>
        <a routerLink="/app/tickets" class="btn-secondary text-xs">
          <i class="ph ph-arrow-left"></i> Volver a Bandeja
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda: Detalle + Bitácora -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bento-card space-y-4">
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Descripción del Caso</h3>
            <p class="text-sm leading-relaxed whitespace-pre-line">{{ ticket.descripcion }}</p>

            <div *ngIf="ticket.observaciones" class="pt-3 border-t border-[#EAEAEA]">
              <span class="text-xs font-mono uppercase text-[#787774] block mb-1">Observaciones</span>
              <p class="text-xs text-[#787774]">{{ ticket.observaciones }}</p>
            </div>

            <div *ngIf="ticket.adjunto" class="pt-3 border-t border-[#EAEAEA]">
              <a [href]="ticket.adjunto" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-mono underline">
                <i class="ph ph-paperclip"></i> Ver archivo adjunto inicial
              </a>
            </div>
          </div>

          <!-- Bitácora / Timeline -->
          <div class="bento-card space-y-4">
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Bitácora de Seguimiento ({{ ticket.historial.length }})</h3>

            <div class="space-y-4">
              <div *ngFor="let h of ticket.historial" class="border-l-2 border-[#111111] pl-4 py-1 space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold">{{ h.usuario }}</span>
                  <span class="font-mono text-[#787774]">{{ h.fecha | date:'yyyy-MM-dd HH:mm' }}</span>
                </div>
                <span class="text-[11px] font-mono text-[#787774] block">Estado: {{ h.estado_anterior }} → {{ h.estado_nuevo }}</span>
                <p class="text-sm text-[#111111] whitespace-pre-line">{{ h.comentario }}</p>
                <a *ngIf="h.adjunto" [href]="h.adjunto" target="_blank" class="inline-flex items-center gap-1 text-xs font-mono underline">
                  <i class="ph ph-paperclip"></i> Adjunto de seguimiento
                </a>
              </div>

              <p *ngIf="ticket.historial.length === 0" class="text-xs text-[#787774]">
                Aún no se han registrado seguimientos en la bitácora.
              </p>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Metadatos + Nuevo seguimiento -->
        <div class="space-y-6">
          <div class="bento-card space-y-2.5 text-xs">
            <h3 class="font-mono uppercase tracking-wider text-[#787774] mb-2">Ficha Técnica</h3>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]">
              <span class="text-[#787774]">Responsable:</span>
              <span class="font-medium">{{ ticket.responsable_nombre }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]">
              <span class="text-[#787774]">Subcategoría:</span>
              <span>{{ ticket.subcategoria || 'General' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]">
              <span class="text-[#787774]">Impacto:</span>
              <span>{{ ticket.impacto }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]">
              <span class="text-[#787774]">Compromiso:</span>
              <span class="font-mono">{{ ticket.fecha_compromiso || 'Sin definir' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]">
              <span class="text-[#787774]">Apertura:</span>
              <span class="font-mono">{{ ticket.fecha_creacion | date:'yyyy-MM-dd HH:mm' }}</span>
            </div>
            <div *ngIf="ticket.fecha_cierre" class="flex justify-between py-1">
              <span class="text-[#787774]">Cierre:</span>
              <span class="font-mono">{{ ticket.fecha_cierre | date:'yyyy-MM-dd HH:mm' }}</span>
            </div>
          </div>

          <!-- Bloqueo si está cerrado -->
          <div *ngIf="isLocked()" class="bento-card bg-[#FAFAFA] text-center space-y-1">
            <i class="ph ph-lock-key text-2xl text-[#787774]"></i>
            <p class="text-sm font-medium">Ticket Finalizado ({{ ticket.estado }})</p>
            <p class="text-xs text-[#787774]">Este ticket se encuentra bloqueado para edición.</p>
          </div>

          <!-- Formulario de seguimiento -->
          <form *ngIf="!isLocked()" (ngSubmit)="submitFollowup()" class="bento-card space-y-3">
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Agregar Seguimiento</h3>

            <div>
              <label class="block text-xs font-medium mb-1">Actualizar Estado</label>
              <select [(ngModel)]="estadoNuevo" name="estadoNuevo" class="input-minimal">
                <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Comentario / Gestión realizada *</label>
              <textarea [(ngModel)]="comentario" name="comentario" rows="3" required class="input-minimal" placeholder="Detalle la acción ejecutada..."></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Evidencia o Adjunto (opcional)</label>
              <input type="file" (change)="onFileSelected($event)" class="input-minimal text-xs" />
            </div>

            <button type="submit" [disabled]="saving" class="btn-primary w-full justify-center">
              <i class="ph ph-paper-plane-tilt"></i> {{ saving ? 'Guardando...' : 'Registrar Avance' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class TicketDetallePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketsService = inject(TicketsService);
  private toast = inject(ToastService);

  ticket: Ticket | null = null;
  estadoNuevo = 'En Proceso';
  comentario = '';
  selectedFile: File | null = null;
  saving = false;

  estados = ['Abierto', 'En Proceso', 'En Espera', 'Resuelto', 'Cerrado', 'Cancelado'];
  estadoBadge = estadoBadgeClass;
  prioridadBadge = prioridadBadgeClass;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
  }

  loadTicket(id: number): void {
    this.ticketsService.getTicket(id).subscribe((res) => {
      this.ticket = res;
      this.estadoNuevo = res.estado;
    });
  }

  isLocked(): boolean {
    return this.ticket?.estado === 'Cerrado' || this.ticket?.estado === 'Cancelado';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  submitFollowup(): void {
    if (!this.ticket || !this.comentario.trim()) {
      this.toast.show('Escriba un comentario de seguimiento', 'error');
      return;
    }
    this.saving = true;
    const fd = new FormData();
    fd.append('estado_nuevo', this.estadoNuevo);
    fd.append('comentario', this.comentario);
    if (this.selectedFile) {
      fd.append('archivo', this.selectedFile);
    }

    this.ticketsService.updateTicket(this.ticket.id, fd).subscribe({
      next: (updated) => {
        this.saving = false;
        this.ticket = updated;
        this.comentario = '';
        this.selectedFile = null;
        this.toast.show('Seguimiento registrado correctamente');
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'Error al actualizar ticket', 'error');
      },
    });
  }
}
