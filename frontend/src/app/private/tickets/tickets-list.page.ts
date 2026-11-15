import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { AuthService } from '../../shared/services/auth.service';
import { Ticket } from '../../shared/models/ticket.model';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../shared/utils/badge.util';

export const ESTADOS = ['Abierto', 'En Proceso', 'Pendiente Ext', 'Escalado', 'Cerrado', 'Cancelado'];
export const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica'];

@Component({
  selector: 'app-tickets-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 fade-entry">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Mesa de Servicio</span>
          <h2 class="font-editorial text-3xl text-[#111111] mt-0.5">Bandeja de Tickets TI</h2>
        </div>
        <a routerLink="/app/tickets/nuevo" class="btn-primary-minimal text-xs inline-flex items-center gap-1.5">
          <i class="ph ph-plus"></i> Nuevo Ticket
        </a>
      </div>

      <div class="bento-card grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label class="block text-[11px] font-mono uppercase text-[#787774] mb-1">Alcance</label>
          <select [(ngModel)]="filters.scope" (change)="loadTickets()" class="input-minimal">
            <option value="mine">Mis tickets</option>
            <option *ngIf="auth.isAdmin()" value="all">Todos (global)</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono uppercase text-[#787774] mb-1">Estado</label>
          <select [(ngModel)]="filters.estado" (change)="loadTickets()" class="input-minimal">
            <option value="">Todos</option>
            <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono uppercase text-[#787774] mb-1">Prioridad</label>
          <select [(ngModel)]="filters.prioridad" (change)="loadTickets()" class="input-minimal">
            <option value="">Todas</option>
            <option *ngFor="let p of prioridades" [value]="p">{{ p }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono uppercase text-[#787774] mb-1">Búsqueda</label>
          <input [(ngModel)]="filters.search" (keyup.enter)="loadTickets()" placeholder="Descripción, #ID… (Enter)" class="input-minimal" />
        </div>
      </div>

      <div class="bg-white border border-[#EAEAEA] rounded-md overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[11px] font-mono uppercase text-[#787774]">
              <th class="py-3 px-4">ID</th>
              <th class="py-3 px-4">Fecha</th>
              <th class="py-3 px-4">Sede / Categoría</th>
              <th class="py-3 px-4">Descripción</th>
              <th class="py-3 px-4">Prioridad</th>
              <th class="py-3 px-4">Estado</th>
              <th class="py-3 px-4">Responsable</th>
              <th class="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EAEAEA] text-sm">
            <tr *ngFor="let t of tickets" class="hover:bg-[#F7F6F3]/60 transition-colors">
              <td class="py-3 px-4 font-mono text-xs">#{{ t.id }}</td>
              <td class="py-3 px-4 font-mono text-xs text-[#787774]">{{ t.fecha_creacion | date: 'yyyy-MM-dd HH:mm' }}</td>
              <td class="py-3 px-4">
                <div class="font-medium">{{ t.categoria_nombre }}</div>
                <div class="text-xs text-[#787774]">{{ t.sede_nombre }} · {{ t.subcategoria_nombre }}</div>
              </td>
              <td class="py-3 px-4 max-w-xs truncate">{{ t.descripcion }}</td>
              <td class="py-3 px-4"><span [class]="priorityBadge(t.prioridad)">{{ t.prioridad }}</span></td>
              <td class="py-3 px-4"><span [class]="statusBadge(t.estado)">{{ t.estado }}</span></td>
              <td class="py-3 px-4 text-xs">{{ t.responsable_nombre }}</td>
              <td class="py-3 px-4 text-right">
                <a [routerLink]="['/app/tickets', t.id]" class="btn-secondary-minimal py-1 px-2.5 text-xs">Ver detalle</a>
              </td>
            </tr>
            <tr *ngIf="tickets.length === 0">
              <td colspan="8" class="py-10 text-center text-sm text-[#787774]">No hay tickets con los filtros seleccionados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TicketsListPageComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  auth = inject(AuthService);

  tickets: Ticket[] = [];
  estados = ESTADOS;
  prioridades = PRIORIDADES;
  filters = { scope: 'mine', estado: '', prioridad: '', search: '' };

  statusBadge = getStatusBadgeClass;
  priorityBadge = getPriorityBadgeClass;

  ngOnInit(): void {
    this.filters.scope = this.auth.isAdmin() ? 'all' : 'mine';
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketsService.getTickets(this.filters).subscribe((res) => (this.tickets = res));
  }
}
