import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { Ticket } from '../../shared/models/ticket.model';
import { User } from '../../shared/models/user.model';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../shared/utils/badge.util';
import { ESTADOS } from './tickets-list.page';

@Component({
  selector: 'app-ticket-detalle-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 fade-entry" *ngIf="ticket">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono-code text-xs font-semibold text-[#2B95D6]">TICKET #{{ ticket.id }}</span>
            <span class="badge-pill badge-neutral">{{ ticket.tipo }}</span>
            <span [class]="statusBadge(ticket.estado)">{{ ticket.estado }}</span>
            <span [class]="priorityBadge(ticket.prioridad)">{{ ticket.prioridad }}</span>
            <span *ngIf="ticket.veces_reabierto > 0" class="badge-pill badge-yellow">
              Reabierto {{ ticket.veces_reabierto }}x
            </span>
          </div>
          <h2 class="text-2xl font-bold text-[#1E293B] mt-1">{{ ticket.categoria_nombre }} · {{ ticket.sede_nombre }}</h2>
        </div>
        <a routerLink="/app/tickets" class="btn-secondary-minimal text-xs inline-flex items-center gap-1.5">
          <i class="ph ph-arrow-left"></i> Volver a bandeja
        </a>
      </div>

      <!-- Banner de Validación de Solución (Flujo GLPI cuando estado === 'Resuelto') -->
      <div *ngIf="ticket.estado === 'Resuelto'" class="bento-card border-l-4 border-[#2B95D6] bg-[#F0F9FF] space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Solución propuesta · Pendiente de validación</span>
            <p class="text-sm text-[#1E293B] mt-1 whitespace-pre-line">{{ ticket.solucion || ticket.observaciones || 'El técnico marcó este ticket como resuelto.' }}</p>
          </div>
        </div>

        <div *ngIf="canValidateOrReopen()" class="pt-3 border-t border-[#BAE6FD] grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Aprobar y Cerrar con Calificación -->
          <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] space-y-3">
            <h4 class="text-xs font-bold uppercase text-[#15803D] flex items-center gap-1.5">
              <i class="ph-bold ph-check-circle"></i> Aprobar solución y cerrar ticket
            </h4>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-[#64748B] mr-1">Calificación:</span>
              <button *ngFor="let star of [1,2,3,4,5]" type="button" (click)="rating = star"
                      class="text-lg transition-transform hover:scale-110"
                      [class.text-[#F59E0B]]="star <= rating" [class.text-[#CBD5E1]]="star > rating">
                <i class="ph-fill ph-star"></i>
              </button>
              <span class="text-xs font-mono-code text-[#475569] ml-1">{{ rating }}/5</span>
            </div>
            <input [(ngModel)]="approveNote" placeholder="Comentario opcional de cierre..." class="input-minimal text-xs" />
            <button type="button" (click)="approve()" [disabled]="saving"
                    class="w-full py-2 px-3 rounded-md bg-[#38A169] hover:bg-[#2F855A] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5">
              <i class="ph-bold ph-check"></i> Aprobar y Cerrar Definitivamente
            </button>
          </div>

          <!-- Rechazar solución y Reabrir -->
          <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] space-y-3">
            <h4 class="text-xs font-bold uppercase text-[#B45309] flex items-center gap-1.5">
              <i class="ph-bold ph-arrow-counter-clockwise"></i> ¿No se resolvió? Reabrir ticket
            </h4>
            <textarea [(ngModel)]="reopenMotivo" rows="2" placeholder="Describe qué falló o por qué necesitas reabrirlo..." class="input-minimal text-xs"></textarea>
            <button type="button" (click)="reopen()" [disabled]="saving"
                    class="w-full py-2 px-3 rounded-md bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5">
              <i class="ph-bold ph-arrow-u-up-left"></i> Rechazar Solución y Reabrir
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bento-card space-y-4">
            <h3 class="text-xs font-mono-code uppercase tracking-wider text-[#64748B]">Descripción del caso</h3>
            <p class="text-sm leading-relaxed whitespace-pre-line text-[#1E293B]">{{ ticket.descripcion }}</p>
            <div *ngIf="ticket.observaciones" class="pt-3 border-t border-[#E2E8F0]">
              <span class="text-xs font-mono-code uppercase text-[#64748B] block mb-1">Última observación técnica</span>
              <p class="text-xs text-[#475569] whitespace-pre-line">{{ ticket.observaciones }}</p>
            </div>
            <div *ngIf="ticket.evidencia_url" class="pt-3 border-t border-[#E2E8F0]">
              <a [href]="auth.getAssetUrl(ticket.evidencia_url)" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-mono-code text-[#2B95D6] hover:underline">
                <i class="ph ph-paperclip"></i> Ver evidencia inicial
              </a>
            </div>
          </div>

          <div class="bento-card space-y-4">
            <h3 class="text-xs font-mono-code uppercase tracking-wider text-[#64748B]">Bitácora de seguimiento ({{ ticket.historial.length }})</h3>
            <div *ngFor="let h of ticket.historial"
                 [class.bg-[#FEFCE8]]="h.es_privado"
                 [class.p-3]="h.es_privado"
                 [class.rounded-md]="h.es_privado"
                 class="border-l-2 border-[#2B95D6] pl-4 py-1 space-y-1">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-[#1E293B]">{{ h.usuario_nombre }}</span>
                  <span *ngIf="h.es_privado" class="badge-pill badge-yellow text-[10px]">Nota Privada TI</span>
                </div>
                <span class="font-mono-code text-[#64748B]">{{ h.fecha | date: 'yyyy-MM-dd HH:mm' }}</span>
              </div>
              <span class="text-[11px] font-mono-code text-[#64748B] block">{{ h.estado_anterior || '—' }} → {{ h.estado_nuevo }}</span>
              <p class="text-sm whitespace-pre-line text-[#334155]">{{ h.comentario }}</p>
              <a *ngIf="h.adjunto_url" [href]="auth.getAssetUrl(h.adjunto_url)" target="_blank" class="inline-flex items-center gap-1 text-xs font-mono-code text-[#2B95D6] hover:underline">
                <i class="ph ph-paperclip"></i> Adjunto
              </a>
            </div>
            <p *ngIf="ticket.historial.length === 0" class="text-xs text-[#64748B]">Aún no hay seguimientos.</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bento-card space-y-2.5 text-xs">
            <h3 class="font-mono-code uppercase tracking-wider text-[#64748B] mb-2">Ficha técnica</h3>
            <div class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Tipo</span><span class="font-semibold">{{ ticket.tipo }}</span></div>
            <div class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Creado por</span><span>{{ ticket.creador_nombre }}</span></div>
            <div class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Responsable</span><span class="font-semibold text-[#1E293B]">{{ ticket.responsable_nombre }}</span></div>
            <div class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Subcategoría</span><span>{{ ticket.subcategoria_nombre }}</span></div>
            <div class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Impacto</span><span>{{ ticket.impacto }}</span></div>
            <div class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Compromiso</span><span class="font-mono-code">{{ ticket.fecha_compromiso || 'Sin definir' }}</span></div>
            <div class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Apertura</span><span class="font-mono-code">{{ ticket.fecha_creacion | date: 'yyyy-MM-dd HH:mm' }}</span></div>
            <div *ngIf="ticket.fecha_cierre" class="flex justify-between py-1.5 border-b border-[#E2E8F0]"><span class="text-[#64748B]">Cierre</span><span class="font-mono-code">{{ ticket.fecha_cierre | date: 'yyyy-MM-dd HH:mm' }}</span></div>
            <div *ngIf="ticket.calificacion" class="flex justify-between py-1.5"><span class="text-[#64748B]">Satisfacción</span><span class="font-semibold text-[#F59E0B]">{{ ticket.calificacion }}/5 ★</span></div>
          </div>

          <!-- Ticket Cerrado / Cancelado + Opción de Reapertura GLPI -->
          <div *ngIf="ticket.esta_bloqueado" class="bento-card bg-[#F8FAFC] space-y-4">
            <div class="text-center space-y-1">
              <i class="ph ph-lock-key text-2xl text-[#64748B]"></i>
              <p class="text-sm font-semibold text-[#1E293B]">Ticket finalizado ({{ ticket.estado }})</p>
              <p class="text-xs text-[#64748B]">Bloqueado para edición directa.</p>
            </div>

            <div *ngIf="canValidateOrReopen()" class="pt-3 border-t border-[#E2E8F0] space-y-2.5">
              <button *ngIf="!showReopenBox" (click)="showReopenBox = true" type="button"
                      class="btn-secondary-minimal w-full text-xs inline-flex items-center justify-center gap-1.5">
                <i class="ph-bold ph-arrow-counter-clockwise"></i> ¿La solución no funcionó? Reabrir ticket
              </button>

              <div *ngIf="showReopenBox" class="space-y-2.5">
                <label class="block text-xs font-semibold text-[#334155]">Motivo de reapertura *</label>
                <textarea [(ngModel)]="reopenMotivo" rows="3" class="input-minimal text-xs" placeholder="Explica por qué el incidente persiste..."></textarea>
                <div class="flex gap-2">
                  <button type="button" (click)="showReopenBox = false" class="btn-secondary-minimal flex-1 text-xs">Cancelar</button>
                  <button type="button" (click)="reopen()" [disabled]="saving"
                          class="flex-1 py-2 px-3 rounded-md bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold">
                    {{ saving ? 'Reabriendo…' : 'Confirmar Reapertura' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Formulario de gestión y seguimiento -->
          <form *ngIf="!ticket.esta_bloqueado" (ngSubmit)="submitFollowup()" class="bento-card space-y-3">
            <h3 class="text-xs font-mono-code uppercase tracking-wider text-[#64748B]">Gestionar / Agregar seguimiento</h3>

            <div>
              <label class="block text-xs font-medium mb-1">Estado</label>
              <select [(ngModel)]="estado" name="estado" class="input-minimal">
                <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Técnico responsable</label>
              <select [(ngModel)]="responsableId" name="responsableId" class="input-minimal">
                <option *ngFor="let u of technicians" [ngValue]="u.id">{{ u.nombre }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Fecha de compromiso</label>
              <input type="date" [(ngModel)]="fechaCompromiso" name="fechaCompromiso" class="input-minimal font-mono-code text-xs" />
            </div>

            <div *ngIf="estado === 'Resuelto'">
              <label class="block text-xs font-medium mb-1 text-[#0369A1]">Solución técnica aplicada *</label>
              <textarea [(ngModel)]="solucion" name="solucion" rows="2" class="input-minimal" placeholder="Describe la solución que validará el usuario…"></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Comentario / gestión realizada *</label>
              <textarea [(ngModel)]="comentario" name="comentario" rows="3" class="input-minimal" placeholder="Detalle la acción ejecutada…"></textarea>
            </div>

            <label class="flex items-center gap-2 text-xs text-[#475569]">
              <input type="checkbox" [(ngModel)]="esPrivado" name="esPrivado" />
              Marcar como nota privada TI
            </label>

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
