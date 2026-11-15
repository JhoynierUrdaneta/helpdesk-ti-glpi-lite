import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { Ticket } from '../../shared/models/ticket.model';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../shared/utils/badge.util';
import { ESTADOS } from './tickets-list.page';

@Component({
  selector: 'app-ticket-detalle-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 fade-entry" *ngIf="ticket">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-[#787774]">TICKET #{{ ticket.id }}</span>
            <span [class]="statusBadge(ticket.estado)">{{ ticket.estado }}</span>
            <span [class]="priorityBadge(ticket.prioridad)">{{ ticket.prioridad }}</span>
          </div>
          <h2 class="font-editorial text-3xl text-[#111111] mt-1">{{ ticket.categoria_nombre }} · {{ ticket.sede_nombre }}</h2>
        </div>
        <a routerLink="/app/tickets" class="btn-secondary-minimal text-xs inline-flex items-center gap-1.5">
          <i class="ph ph-arrow-left"></i> Volver a bandeja
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bento-card space-y-4">
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Descripción del caso</h3>
            <p class="text-sm leading-relaxed whitespace-pre-line">{{ ticket.descripcion }}</p>
            <div *ngIf="ticket.observaciones" class="pt-3 border-t border-[#EAEAEA]">
              <span class="text-xs font-mono uppercase text-[#787774] block mb-1">Observaciones</span>
              <p class="text-xs text-[#787774] whitespace-pre-line">{{ ticket.observaciones }}</p>
            </div>
            <div *ngIf="ticket.evidencia_url" class="pt-3 border-t border-[#EAEAEA]">
              <a [href]="auth.getAssetUrl(ticket.evidencia_url)" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-mono underline">
                <i class="ph ph-paperclip"></i> Ver evidencia inicial
              </a>
            </div>
          </div>

          <div class="bento-card space-y-4">
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Bitácora de seguimiento ({{ ticket.historial.length }})</h3>
            <div *ngFor="let h of ticket.historial" class="border-l-2 border-[#111111] pl-4 py-1 space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold">{{ h.usuario_nombre }}</span>
                <span class="font-mono text-[#787774]">{{ h.fecha | date: 'yyyy-MM-dd HH:mm' }}</span>
              </div>
              <span class="text-[11px] font-mono text-[#787774] block">{{ h.estado_anterior || '—' }} → {{ h.estado_nuevo }}</span>
              <p class="text-sm whitespace-pre-line">{{ h.comentario }}</p>
              <a *ngIf="h.adjunto_url" [href]="auth.getAssetUrl(h.adjunto_url)" target="_blank" class="inline-flex items-center gap-1 text-xs font-mono underline">
                <i class="ph ph-paperclip"></i> Adjunto
              </a>
            </div>
            <p *ngIf="ticket.historial.length === 0" class="text-xs text-[#787774]">Aún no hay seguimientos.</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bento-card space-y-2.5 text-xs">
            <h3 class="font-mono uppercase tracking-wider text-[#787774] mb-2">Ficha técnica</h3>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]"><span class="text-[#787774]">Creado por</span><span>{{ ticket.creador_nombre }}</span></div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]"><span class="text-[#787774]">Responsable</span><span class="font-medium">{{ ticket.responsable_nombre }}</span></div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]"><span class="text-[#787774]">Subcategoría</span><span>{{ ticket.subcategoria_nombre }}</span></div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]"><span class="text-[#787774]">Impacto</span><span>{{ ticket.impacto }}</span></div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]"><span class="text-[#787774]">Compromiso</span><span class="font-mono">{{ ticket.fecha_compromiso || 'Sin definir' }}</span></div>
            <div class="flex justify-between py-1 border-b border-[#EAEAEA]"><span class="text-[#787774]">Apertura</span><span class="font-mono">{{ ticket.fecha_creacion | date: 'yyyy-MM-dd HH:mm' }}</span></div>
            <div *ngIf="ticket.fecha_cierre" class="flex justify-between py-1"><span class="text-[#787774]">Cierre</span><span class="font-mono">{{ ticket.fecha_cierre | date: 'yyyy-MM-dd HH:mm' }}</span></div>
          </div>

          <div *ngIf="ticket.esta_bloqueado" class="bento-card bg-[#FAFAFA] text-center space-y-1">
            <i class="ph ph-lock-key text-2xl text-[#787774]"></i>
            <p class="text-sm font-medium">Ticket finalizado ({{ ticket.estado }})</p>
            <p class="text-xs text-[#787774]">Bloqueado para edición.</p>
          </div>

          <form *ngIf="!ticket.esta_bloqueado" (ngSubmit)="submitFollowup()" class="bento-card space-y-3">
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Agregar seguimiento</h3>
            <div>
              <label class="block text-xs font-medium mb-1">Estado</label>
              <select [(ngModel)]="estado" name="estado" class="input-minimal">
                <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Comentario / gestión realizada *</label>
              <textarea [(ngModel)]="comentario" name="comentario" rows="3" class="input-minimal" placeholder="Detalle la acción ejecutada…"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Adjunto (opcional)</label>
              <input type="file" (change)="onFileSelected($event)" class="input-minimal text-xs" />
            </div>
            <button type="submit" [disabled]="saving" class="btn-primary-minimal w-full inline-flex items-center justify-center gap-1.5">
              <i class="ph ph-paper-plane-tilt"></i> {{ saving ? 'Guardando…' : 'Registrar avance' }}
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
  auth = inject(AuthService);

  ticket: Ticket | null = null;
  estado = '';
  comentario = '';
  selectedFile: File | null = null;
  saving = false;

  estados = ESTADOS;
  statusBadge = getStatusBadgeClass;
  priorityBadge = getPriorityBadgeClass;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.ticketsService.getTicketById(id).subscribe((res) => this.setTicket(res));
  }

  private setTicket(t: Ticket): void {
    this.ticket = t;
    this.estado = t.estado;
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
    if (this.selectedFile) fd.append('evidencia', this.selectedFile);

    this.saving = true;
    this.ticketsService.manageTicket(this.ticket.id, fd).subscribe({
      next: (updated) => {
        this.saving = false;
        this.setTicket(updated);
        this.comentario = '';
        this.selectedFile = null;
        this.toast.show('Seguimiento registrado');
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'Error al actualizar ticket', 'error');
      },
    });
  }
}
